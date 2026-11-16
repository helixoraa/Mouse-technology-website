import type { Office } from './types';

/** Unfilled CMS placeholders look like "[Business email]"; they are shown as text, never linked. */
export const isPlaceholder = (v?: string | null) => !v || /^\s*\[/.test(v);

/** tel: link in E.164 ("+1 (716) 533-2271" -> "tel:+17165332271"); undefined for placeholders. */
export const telHref = (phone?: string | null) => {
  if (isPlaceholder(phone)) return undefined;
  const digits = phone!.replace(/\D/g, '');
  return digits ? `tel:+${digits}` : undefined;
};

export const mailHref = (email?: string | null) => (isPlaceholder(email) ? undefined : `mailto:${email!.trim()}`);

export const officesOf = (site?: { offices?: Office[] }) => site?.offices ?? [];
