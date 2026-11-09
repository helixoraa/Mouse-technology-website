/** True for absolute http(s) links, which must open as a normal anchor (React Router's <Link> treats them as paths). */
export const isExternalUrl = (href: string) => /^https?:\/\//i.test(href);
