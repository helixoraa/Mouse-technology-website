import crypto from 'node:crypto';

/** Parses a 32-byte key given as 64 hex chars or base64. Returns null when invalid. */
export function parseEncryptionKey(raw: string | undefined): Buffer | null {
  if (!raw) return null;
  const v = raw.trim();
  if (/^[0-9a-fA-F]{64}$/.test(v)) return Buffer.from(v, 'hex');
  if (/^[A-Za-z0-9+/_-]{43}=?$/.test(v)) {
    const b = Buffer.from(v, 'base64');
    if (b.length === 32) return b;
  }
  return null;
}

let warned = false;
function getKey(): Buffer {
  const k = parseEncryptionKey(process.env.TOTP_ENCRYPTION_KEY);
  if (k) return k;
  if (process.env.NODE_ENV === 'production') throw new Error('TOTP_ENCRYPTION_KEY is missing or invalid');
  if (!warned) {
    warned = true;
    console.warn('[dev] TOTP_ENCRYPTION_KEY not set: deriving a development key from JWT_SECRET. Set it in server/.env.');
  }
  return crypto
    .createHash('sha256')
    .update(`maouaj-totp-dev:${process.env.JWT_SECRET ?? ''}`)
    .digest();
}

/** AES-256-GCM. Output: v1:<iv>:<tag>:<ciphertext> (base64url). */
export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), enc.toString('base64url')].join(':');
}

export function decryptSecret(payload: string): string {
  const [v, iv, tag, data] = payload.split(':');
  if (v !== 'v1' || !iv || !tag || !data) throw new Error('Unsupported ciphertext');
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8');
}
