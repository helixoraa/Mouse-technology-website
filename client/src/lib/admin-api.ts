import { api, ApiError, mediaUrl } from './api';

export interface MediaItem {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt?: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  organisation: string | null;
  interest: string | null;
  message: string;
  status: 'NEW' | 'CONTACTED';
  createdAt: string;
}

export interface AdminSection {
  id: string;
  page: string;
  key: string;
  content: unknown;
  order: number;
  visible: boolean;
}

export interface Stats {
  leads: { total: number; new: number; contacted: number };
  recentLeads: Lead[];
  content: Record<string, number>;
}

export const PAGES: { key: string; label: string; path: string }[] = [
  { key: 'home', label: 'Homepage', path: '/' },
  { key: 'vision', label: 'Our Vision', path: '/our-vision' },
  { key: 'about', label: 'About Us', path: '/about-us' },
  { key: 'team', label: 'Our Team', path: '/our-team' },
  { key: 'contact', label: 'Contact Us', path: '/contact-us' },
  { key: 'products', label: 'Our Products', path: '/our-products' },
  { key: 'projects', label: 'Our Projects', path: '/our-projects' },
  { key: 'blog', label: 'Blog & Updates', path: '/blog' },
  { key: 'terms', label: 'Terms of Use', path: '/terms-of-use' },
  { key: 'privacy', label: 'Privacy Policy', path: '/privacy-policy' },
];

export function errMsg(e: unknown): string {
  if (e instanceof ApiError) {
    const d = e.details;
    if (Array.isArray(d) && d.length) {
      return `${e.message}: ${d.map((x) => (typeof x === 'string' ? x : (x?.message ?? JSON.stringify(x)))).join('; ')}`;
    }
    if (d && typeof d === 'object') {
      const flat = JSON.stringify(d);
      return flat.length < 200 ? `${e.message}: ${flat}` : e.message;
    }
    return e.message;
  }
  return e instanceof Error ? e.message : 'Something went wrong';
}

export function uploadMedia(file: File): Promise<MediaItem> {
  const fd = new FormData();
  fd.append('file', file);
  return api<MediaItem>('/admin/media', { method: 'POST', body: fd });
}

export async function downloadLeadsCsv(): Promise<void> {
  const res = await fetch(`${mediaUrl('')}/api/admin/leads/export.csv`, { credentials: 'include' });
  if (!res.ok) throw new ApiError(res.status, 'Export failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '');

export const fmtSize = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
