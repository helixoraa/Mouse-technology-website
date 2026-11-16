/** Unfilled CMS placeholders look like "[Business telephone]"; they are shown as text, never linked. */
export const isPlaceholder = (v?: string | null) => !v || /^\s*\[/.test(v);

/** tel: link in E.164 ("+1 (555) 010-0000" -> "tel:+15550100000"); undefined for placeholders. */
export const telHref = (phone?: string | null) => {
  if (isPlaceholder(phone)) return undefined;
  const digits = phone!.replace(/\D/g, '');
  return digits ? `tel:+${digits}` : undefined;
};

export const mailHref = (email?: string | null) => (isPlaceholder(email) ? undefined : `mailto:${email!.trim()}`);
