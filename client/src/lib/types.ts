export interface NavLink {
  label: string;
  href: string;
}
export interface SiteSettings {
  siteName: string;
  tagline: string;
  logoUrl: string | null;
  email: string;
  phone: string;
  address: string;
  socials: Record<string, string>;
  nav: NavLink[];
  footer: { tagline: string; columns: { title: string; links: NavLink[] }[]; copyright: string };
  seo: { default: { title: string; description: string; ogImage?: string } };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Json = Record<string, any>;
export interface Section<T = Json> {
  id: string;
  key: string;
  order: number;
  visible?: boolean;
  content: T;
}
export interface PageData {
  page: string;
  seo: { title: string; description: string; ogImage?: string };
  sections: Section[];
}
export interface Service {
  id: string;
  slug: string;
  title: string;
  category: 'product' | 'planned' | 'business';
  status: string;
  summary: string;
  description: string | null;
  image: string | null;
  gradient: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  order: number;
  visible: boolean;
  extra: Json | null;
}
export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string | null;
  quote: string;
  avatar: string | null;
  order: number;
  visible: boolean;
}
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo: string | null;
  order: number;
  visible: boolean;
}
export interface Faq {
  id: string;
  question: string;
  answer: string;
  order: number;
  visible: boolean;
}
export interface Post {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  body: string | null;
  image: string | null;
  author: string;
  publishedAt: string;
  dateLabel: string | null;
  visible: boolean;
}
export interface Segment {
  text: string;
  accent?: boolean;
}
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'EDITOR';
}
