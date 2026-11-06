/**
 * Lockout recovery when nobody can sign in:
 *   npm run admin:reset -w server -- --email someone@example.com
 * Sets a new random temporary password (printed once), forces a password change at the next login,
 * invalidates existing sessions and lifts any lock. Activates the account.
 * Reads DATABASE_URL from the environment (e.g. after `vercel env pull .env.production.local`).
 */
import 'dotenv/config';
import { prisma } from '../src/db.js';
import { audit } from '../src/lib/audit.js';
import { generateTempPassword, hashPassword } from '../src/lib/password.js';
import { unlockAccount } from '../src/lib/ratelimit.js';

const args = process.argv.slice(2);
const i = args.indexOf('--email');
const email = (i >= 0 ? args[i + 1] : args.find((a) => a.startsWith('--email='))?.split('=')[1])?.trim().toLowerCase();

async function main() {
  if (!email) {
    console.error('Usage: npm run admin:reset -w server -- --email user@example.com');
    process.exitCode = 1;
    return;
  }
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Pull the environment first (vercel env pull) or export it.');
    process.exitCode = 1;
    return;
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user with email ${email}`);
    process.exitCode = 1;
    return;
  }
  const temporaryPassword = generateTempPassword();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: await hashPassword(temporaryPassword),
      mustChangePassword: true,
      active: true,
      sessionVersion: { increment: 1 },
    },
  });
  await unlockAccount(user.id);
  await audit(null, { userId: user.id, email: user.email, action: 'cli.admin.reset' });
  console.log(`\nAccount reset for ${user.email} (${user.role}).`);
  console.log(`Temporary password (shown once): ${temporaryPassword}`);
  console.log('At the next sign-in they must choose a new password.\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
