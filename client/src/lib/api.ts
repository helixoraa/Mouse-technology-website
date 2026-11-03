import { useQuery } from '@tanstack/react-query';
import type { Faq, Json, PageData, Post, Service, SiteSettings, TeamMember, Testimonial } from './types';

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isForm = init.body instanceof FormData;
  const res = await fetch(`${BASE}/api${path}`, {
    credentials: 'include',
    ...init,
    headers: { ...(init.body && !isForm ? { 'Content-Type': 'application/json' } : {}), ...(init.headers ?? {}) },
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data?.error ?? res.statusText, data?.details);
  return data as T;
}

/** Resolve an uploaded/seeded media URL against the API origin. */
export function mediaUrl(src?: string | null): string {
  if (!src) return '';
  if (/^(https?:|data:|blob:)/.test(src) || src.startsWith('/animations/')) return src; // /animations/* ships with the client
  return `${BASE}${src}`;
}

const stale = { staleTime: 30_000 };
export const useSite = () => useQuery({ queryKey: ['site'], queryFn: () => api<SiteSettings>('/site'), ...stale });
export const usePage = (page: string) => useQuery({ queryKey: ['page', page], queryFn: () => api<PageData>(`/pages/${page}`), ...stale });
export const useServices = (category?: string) =>
  useQuery({
    queryKey: ['services', category ?? 'all'],
    queryFn: () => api<Service[]>(`/services${category ? `?category=${category}` : ''}`),
    ...stale,
  });
export const useTeam = () => useQuery({ queryKey: ['team'], queryFn: () => api<TeamMember[]>('/team'), ...stale });
export const useFaqs = () => useQuery({ queryKey: ['faqs'], queryFn: () => api<Faq[]>('/faqs'), ...stale });
export const useTestimonials = () => useQuery({ queryKey: ['testimonials'], queryFn: () => api<Testimonial[]>('/testimonials'), ...stale });
export const usePosts = () => useQuery({ queryKey: ['posts'], queryFn: () => api<Post[]>('/posts'), ...stale });

export function getSection<T = Json>(page: PageData | undefined, key: string): T | undefined {
  return page?.sections.find((s) => s.key === key)?.content as T | undefined;
}
