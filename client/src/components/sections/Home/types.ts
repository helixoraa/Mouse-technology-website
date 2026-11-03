import type { Segment } from '@/lib/types';

export interface Cta {
  label: string;
  href: string;
}

export interface HeroContent {
  headline: Segment[];
  lead: string;
  primaryCta: Cta;
  secondaryCta: Cta;
  floatingChip: string;
  phone: {
    time: string;
    title: string;
    resultTitle: string;
    resultText: string;
    balanceLabel: string;
    balance: string;
    recentTitle: string;
    rows: { label: string; status: string }[];
  };
  card: { label: string; brand: string; tap: string };
  transfer: { title: string; status: string; rows: { label: string; value: string }[]; steps: string[] };
}

export interface BusVisualContent {
  operatorTitle: string;
  operatorText: string;
  readerStatus: string;
  readerHint: string;
  cardLabel: string;
  cardBrand: string;
}

export interface MoneyVisualContent {
  panelTitle: string;
  panelStatus: string;
  rows: { label: string; value: string }[];
  confirm: string;
  trackerTitle: string;
  trackerSteps: string[];
}

export interface ProductItem {
  key: 'bus' | 'payment';
  title: string;
  text: string;
  journey: string[];
  features: string[];
  note: string;
  cta: Cta;
  visual: BusVisualContent & MoneyVisualContent;
}

export interface ProductsContent {
  title: Segment[];
  intro: string;
  items: ProductItem[];
}

export interface BusFareContent {
  title: Segment[];
  lead: string;
  image: string;
  imageAlt: string;
  cards: { title: string; text: string }[];
}

export interface PaymentContent {
  title: Segment[];
  lead: string;
  image: string;
  imageAlt: string;
  steps: { no: string; label: string }[];
}

export interface FocusContent {
  title: Segment[];
  subtitle: string;
  description: string;
  pillars: { icon: string; word: string; title: string; text: string }[];
}

export interface ProjectsContent {
  title: Segment[];
  lead: string;
  items: { icon: string; title: string; text: string; textWidth?: number }[];
}

export interface FaqContent {
  titleLines: Segment[];
  lead: string;
}

export interface BlogContent {
  title: Segment[];
  lead: string;
  linkLabel: string;
  linkHref: string;
}

export interface ContactContent {
  title: Segment[];
  lead: string;
  details: { icon: string; label: string; field: 'email' | 'phone' | 'address' }[];
  form: import('../Contact/ContactForm').ContactFormContent;
}
