export interface PasswordRule {
  id: string;
  label: string;
  ok: boolean;
}

const COMMON = ['password', 'passw0rd', 'qwerty', '123456', 'letmein', 'welcome', 'admin', 'changeme', 'maouaj', 'iloveyou'];

/** Rules shown live under the new-password field. The server enforces its own policy; this mirrors it for feedback. */
export function passwordRules(pw: string): PasswordRule[] {
  const lower = /[a-z]/.test(pw);
  const upper = /[A-Z]/.test(pw);
  const digit = /\d/.test(pw);
  const symbol = /[^A-Za-z0-9]/.test(pw);
  const classes = [lower, upper, digit, symbol].filter(Boolean).length;
  const common = COMMON.some((w) => pw.toLowerCase().includes(w));
  return [
    { id: 'length', label: 'At least 12 characters', ok: pw.length >= 12 },
    { id: 'mix', label: 'Mix of upper-case, lower-case, numbers and symbols (3 of 4)', ok: classes >= 3 },
    { id: 'common', label: 'No common words or easy patterns', ok: pw.length > 0 && !common && !/(.)\1{3,}/.test(pw) },
  ];
}

export function isStrongPassword(pw: string): boolean {
  return passwordRules(pw).every((r) => r.ok);
}

/** 0 (empty) … 4 (very strong) */
export function passwordScore(pw: string): 0 | 1 | 2 | 3 | 4 {
  if (!pw) return 0;
  const rules = passwordRules(pw);
  let score = rules.filter((r) => r.ok).length; // 0..3
  if (pw.length >= 16 && rules.every((r) => r.ok)) score += 1;
  return Math.min(4, Math.max(score, 1)) as 1 | 2 | 3 | 4;
}

/** Cryptographically random temp-password style helper is server-side only; this is just display formatting. */
export const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'] as const;
