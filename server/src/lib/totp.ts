import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { prisma } from '../db.js';
import { decryptSecret } from './crypto.js';
import { BCRYPT_ROUNDS } from './password.js';

authenticator.options = { step: 30, digits: 6, window: 1 };
export const ISSUER = 'MAOUAJ Technology';

export const generateSecret = () => authenticator.generateSecret();
export const keyUri = (email: string, secret: string) => authenticator.keyuri(email, ISSUER, secret);
export const qrDataUrl = (uri: string) => QRCode.toDataURL(uri, { margin: 1, width: 240 });

/** Returns the absolute time step matched by `code` (window +-1) or null. */
export function matchStep(secret: string, code: string, now = Date.now()): number | null {
  if (!/^\d{6}$/.test(code)) return null;
  // A per-call clone: mutating the shared instance's options would leak (and freeze) the epoch between calls.
  const delta = authenticator.clone({ epoch: now }).checkDelta(code, secret);
  if (delta === null || delta === undefined) return null;
  return Math.floor(now / 1000 / 30) + delta;
}

/** Atomically records `step` so the same (or an older) code cannot be accepted again. */
export async function consumeStep(userId: string, step: number): Promise<boolean> {
  const res = await prisma.user.updateMany({
    where: { id: userId, OR: [{ totpLastStep: null }, { totpLastStep: { lt: step } }] },
    data: { totpLastStep: step },
  });
  return res.count === 1;
}

/** Verifies a TOTP code for the user and consumes its time step (replay protection). */
export async function verifyTotpAndConsume(user: { id: string; totpSecretEnc: string | null }, code: string): Promise<boolean> {
  if (!user.totpSecretEnc) return false;
  const step = matchStep(decryptSecret(user.totpSecretEnc), code.trim());
  if (step === null) return false;
  return consumeStep(user.id, step);
}

/* ---------- backup codes ---------- */
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
export const normalizeBackup = (c: string) => c.toLowerCase().replace(/[^a-z0-9]/g, '');

export function generateBackupCodes(n = 10): string[] {
  return Array.from({ length: n }, () => {
    const raw = Array.from({ length: 10 }, () => ALPHABET[crypto.randomInt(ALPHABET.length)]).join('');
    return `${raw.slice(0, 5)}-${raw.slice(5)}`;
  });
}

/** Replaces all backup codes of the user with a fresh set; returns the plaintext codes (shown once). */
export async function replaceBackupCodes(userId: string): Promise<string[]> {
  const codes = generateBackupCodes();
  const rounds = Math.min(BCRYPT_ROUNDS, 10);
  const hashes = await Promise.all(codes.map((c) => bcrypt.hash(normalizeBackup(c), rounds)));
  await prisma.$transaction([
    prisma.backupCode.deleteMany({ where: { userId } }),
    prisma.backupCode.createMany({ data: hashes.map((codeHash) => ({ userId, codeHash })) }),
  ]);
  return codes;
}

/** Single use: marks the matching code as used atomically. */
export async function consumeBackupCode(userId: string, input: string): Promise<boolean> {
  const normalized = normalizeBackup(input);
  if (normalized.length !== 10) return false;
  const rows = await prisma.backupCode.findMany({ where: { userId, usedAt: null } });
  for (const row of rows) {
    if (await bcrypt.compare(normalized, row.codeHash)) {
      const res = await prisma.backupCode.updateMany({ where: { id: row.id, usedAt: null }, data: { usedAt: new Date() } });
      return res.count === 1;
    }
  }
  return false;
}
