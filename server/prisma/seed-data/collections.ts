/**
 * Seed content for the shared collections. Text and images come from the Figma frames
 * (Our Projects, Our Team, Homepage FAQ + blog, footer). Images reference /uploads/seed/<name>.webp
 * (generated from server/seed-media by prisma/seed.ts).
 */
import { blogPosts } from './blog.js';

const seedImg = (name: string) => `/uploads/seed/${name}`;

/**
 * Services and posts have fixed ids: the seed finds its rows by id, never by slug, so a renamed slug can't create a
 * duplicate (see prisma/seed-ids.ts). Never change an id; add the old slug to formerSlugs when a slug changes.
 */
export const services = [
  {
    id: 'seed-service-bus-fare',
    slug: 'cashless-bus-fare-platform',
    title: 'Cashless Bus Fare Platform',
    category: 'product',
    status: 'In development',
    summary: 'Transit-card fare payments, passenger balances, top-ups and operating records for bus services.',
    image: seedImg('project-cashless-bus.webp'),
    gradient: 'linear-gradient(144.97deg, #1d4ed8 13.139%, #6d28d9 56.934%, #0e7490 86.131%)',
    ctaLabel: 'Learn more',
    ctaHref: '/our-products',
    order: 0,
  },
  {
    id: 'seed-service-payment',
    slug: 'payment-money-transfer-platform',
    title: 'Payment / Money Transfer Platform',
    category: 'product',
    status: 'In development',
    summary: 'A digital product intended to simplify sending money, reviewing transaction details and following transfer progress.',
    image: seedImg('project-payment.webp'),
    gradient: 'linear-gradient(144.97deg, #6d28d9 13.139%, #2f4bff 86.131%)',
    ctaLabel: 'Learn more',
    ctaHref: '/our-products',
    order: 1,
  },
  {
    id: 'seed-service-ride-hailing',
    slug: 'ride-hailing-platform',
    title: 'Ride-Hailing Platform',
    category: 'planned',
    status: 'Planned',
    summary:
      'A future service connecting riders and drivers. The project will be developed around its own distinctive service proposition.',
    image: seedImg('project-ride-hailing.webp'),
    gradient: 'linear-gradient(146.48deg, #0e7490 13.139%, #1d4ed8 86.131%)',
    ctaLabel: 'Learn more',
    ctaHref: '/our-projects',
    order: 2,
  },
  {
    id: 'seed-service-ecommerce',
    slug: 'e-commerce-platform',
    title: 'E-commerce Platform',
    category: 'planned',
    status: 'Planned',
    summary:
      'A future digital commerce service connecting customers with products and sellers. This is separate from our existing retail business.',
    image: seedImg('project-ecommerce.webp'),
    gradient: 'linear-gradient(146.48deg, #6d28d9 13.139%, #2f4bff 86.131%)',
    ctaLabel: 'Learn more',
    ctaHref: '/our-projects',
    order: 3,
  },
  {
    id: 'seed-service-textile',
    slug: 'textile-business',
    title: 'Textile business',
    category: 'business',
    status: 'Existing business',
    summary: 'An existing business within the wider MAOUAJ Technology portfolio. [Add product offering and introduction.]',
    image: seedImg('project-textile.webp'),
    gradient: 'linear-gradient(146.48deg, #0e7490 13.139%, #1d4ed8 86.131%)',
    ctaLabel: 'Learn more',
    ctaHref: '/our-projects',
    order: 4,
  },
  {
    id: 'seed-service-hossainandmoallema',
    slug: 'hossainandmoallema-com',
    title: 'HossainandMoallema.com',
    category: 'business',
    status: 'Existing business',
    summary: 'An existing e-commerce business and part of our online retail interests. [Add what it offers customers.]',
    image: seedImg('project-hussain.webp'),
    gradient: 'linear-gradient(159.16deg, #60a5fa 14.789%, #2f4bff 85.211%)',
    ctaLabel: 'Learn more',
    ctaHref: 'https://hossainandmoallema.com/',
    order: 5,
  },
];

/** Earlier slugs of seed records (by id), so rows created under an old slug are still recognised. */
export const formerSlugs: Record<string, string[]> = {
  'seed-service-hossainandmoallema': ['hussainandmuallima-com'],
};

// Figma "Team carousel": 8 placeholder members (names/roles/biographies "to be supplied").
export const team = [
  'team-photo-1.webp',
  'team-photo-2.webp',
  'team-photo-3.webp',
  'team-photo-4.webp',
  'team-photo-5.svg',
  'team-photo-6.svg',
  'team-photo-7.svg',
  'team-photo-8.svg',
].map((photo, order) => ({
  name: 'Full name',
  role: 'Role / title',
  bio: 'Short professional biography to be supplied.',
  photo: seedImg(photo),
  order,
}));

export const faqs = [
  {
    question: 'Are these products available now?',
    answer: 'Both products are in development. Availability will be announced when confirmed.',
    order: 0,
  },
  {
    question: 'Which card will the bus platform support?',
    answer: 'The initial product uses supported transit cards. Participating services and top-up options will be announced when confirmed.',
    order: 1,
  },
  {
    question: 'Where will users be able to send money?',
    answer:
      'Supported markets, currencies, payment and delivery options, pricing and launch availability will be announced when confirmed.',
    order: 2,
  },
  {
    question: 'What will a transfer cost, and how long will it take?',
    answer:
      'Applicable fees and the estimated delivery time will be shown before you confirm a transfer. Pricing and launch availability will be announced when confirmed.',
    order: 3,
  },
];

const postText = 'Add balance, tap a supported transit card on the bus, receive the result and review your history.';
export const homePosts = [
  {
    id: 'seed-post-home-bus-fare',
    slug: 'how-the-cashless-bus-fare-platform-will-work',
    title: 'How the cashless bus fare platform will work',
    category: 'Product explainer',
    excerpt: postText,
    image: seedImg('home-blog-1.webp'),
    author: 'MAOUAJ Team',
    publishedAt: new Date('2026-06-30T09:00:00Z'),
  },
  {
    id: 'seed-post-home-payment',
    slug: 'an-introduction-to-the-payment-platform',
    title: 'An introduction to the payment platform',
    category: 'Product introduction',
    excerpt: postText,
    image: seedImg('home-blog-2.webp'),
    author: 'MAOUAJ Team',
    publishedAt: new Date('2026-06-29T09:00:00Z'),
  },
  {
    id: 'seed-post-home-payment-2',
    slug: 'an-introduction-to-the-payment-platform-2',
    title: 'An introduction to the payment platform',
    category: 'Product introduction',
    excerpt: postText,
    image: seedImg('home-blog-3.webp'),
    author: 'MAOUAJ Team',
    publishedAt: new Date('2026-06-28T09:00:00Z'),
  },
];

export const posts = [...homePosts, ...blogPosts.map((p) => ({ ...p, publishedAt: new Date(p.publishedAt + 'T09:00:00Z') }))];

// Figma contains no testimonials.
export const testimonials: { name: string; role: string; company?: string; quote: string; avatar?: string; order: number }[] = [];

export const settings = {
  siteName: 'MAOUAJ Technology',
  tagline: 'Technology for the way people move, pay and trade.',
  logoUrl: null as string | null,
  email: '[Business email]',
  phone: '[Business telephone]',
  address: '[Address and public business details]',
  socials: {} as Record<string, string>,
  nav: [
    { label: 'Products', href: '/our-products' },
    { label: 'Projects', href: '/our-projects' },
    { label: 'Our Vision', href: '/our-vision' },
    { label: 'About Us', href: '/about-us' },
    { label: 'Our Team', href: '/our-team' },
    { label: 'Blog & Updates', href: '/blog' },
    { label: 'Contact Us', href: '/contact-us' },
  ],
  footer: {
    tagline: 'Technology for the way people move, pay and trade.',
    columns: [
      {
        title: 'COMPANY',
        links: [
          { label: 'Our Vision', href: '/our-vision' },
          { label: 'About Us', href: '/about-us' },
          { label: 'Our Team', href: '/our-team' },
          { label: 'Our Projects', href: '/our-projects' },
          { label: 'Blog & Updates', href: '/blog' },
          { label: 'Contact Us', href: '/contact-us' },
        ],
      },
      {
        title: 'PRODUCTS',
        links: [
          { label: 'Cashless Bus Fare Platform', href: '/our-products' },
          { label: 'Payment / Money Transfer', href: '/our-products' },
        ],
      },
      {
        title: 'LEGAL',
        links: [
          { label: 'Privacy Policy', href: '/privacy-policy' },
          { label: 'Terms of Use', href: '/terms-of-use' },
        ],
      },
    ],
    copyright: '© 2026 MAOUAJ Technology. All rights reserved.',
  },
  seo: {
    default: {
      title: 'MAOUAJ Technology — Technology for the way people move, pay and trade',
      description: 'Digital platforms for cashless bus fares and clearer money transfers, with ride-hailing and e-commerce planned next.',
      ogImage: '',
    },
  },
};
