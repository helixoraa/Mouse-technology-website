/**
 * Production secret guard. The single place that decides whether ADMIN_PASSWORD / JWT_SECRET are still
 * example or default values. Used by env.ts (API start) and by the container entrypoint before seeding.
 */

/** Values copied from .env.example files / docs. Compared case-insensitively. */
export const DEFAULT_ADMIN_PASSWORDS = ['changeme123!', 'changeme', 'password', 'password123', 'admin', 'admin123', 'maouaj', 'secret'];
export const DEFAULT_JWT_SECRETS = ['change-me-to-a-long-random-string', 'changeme', 'secret', 'jwt_secret', 'jwtsecret'];

const PLACEHOLDER = /^(change[-_ ]?me|replace[-_ ]?me|your[-_ ]|example|todo|xxx+)/i;

export const MIN_JWT_SECRET_LENGTH = 32;
export const MIN_ADMIN_PASSWORD_LENGTH = 12;

export function productionSecretProblems(vars: { JWT_SECRET?: string; ADMIN_PASSWORD?: string }): string[] {
  const problems: string[] = [];
  const jwt = (vars.JWT_SECRET ?? '').trim();
  const pw = (vars.ADMIN_PASSWORD ?? '').trim();

  if (!jwt) problems.push('JWT_SECRET is empty.');
  else if (DEFAULT_JWT_SECRETS.includes(jwt.toLowerCase()) || PLACEHOLDER.test(jwt))
    problems.push('JWT_SECRET is still an example/default value.');
  else if (jwt.length < MIN_JWT_SECRET_LENGTH)
    problems.push(`JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters in production.`);

  if (!pw) problems.push('ADMIN_PASSWORD is empty.');
  else if (DEFAULT_ADMIN_PASSWORDS.includes(pw.toLowerCase()) || PLACEHOLDER.test(pw))
    problems.push('ADMIN_PASSWORD is still an example/default value.');
  else if (pw.length < MIN_ADMIN_PASSWORD_LENGTH)
    problems.push(`ADMIN_PASSWORD must be at least ${MIN_ADMIN_PASSWORD_LENGTH} characters in production.`);

  return problems;
}

/** Exits the process with a clear message when running in production with unsafe secrets. */
export function assertProductionSecrets(vars: { NODE_ENV?: string; JWT_SECRET?: string; ADMIN_PASSWORD?: string }): void {
  if (vars.NODE_ENV !== 'production') return;
  const problems = productionSecretProblems(vars);
  if (problems.length === 0) return;
  console.error(
    [
      '',
      'Refusing to start in production with unsafe secrets:',
      ...problems.map((p) => `  - ${p}`),
      'Set strong, unique values (e.g. `openssl rand -base64 48`) and restart.',
      '',
    ].join('\n'),
  );
  process.exit(1);
}
