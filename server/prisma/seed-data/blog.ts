import type { PageSeed } from './types.js';

/** Blog & Updates frame (Figma 19:256). Posts themselves live in collections.ts (Post model). */
const blog: PageSeed = {
  page: 'blog',
  seo: {
    title: 'Blog & Updates | MAOUAJ Technology',
    description: 'Explore product explanations, project progress and company news from MAOUAJ Technology.',
  },
  sections: [
    {
      key: 'hero',
      order: 1,
      content: {
        eyebrow: 'Blog & Updates',
        title: [{ text: 'Recent updates and\n' }, { text: 'project news.', accent: true }],
        lead: 'Explore product explanations, project progress and company news from MAOUAJ Technology.',
      },
    },
    {
      key: 'articles',
      order: 2,
      content: {
        filters: ['All', 'Product explainers', 'Project updates', 'Company news'],
        readLabel: 'Read article',
        emptyTitle: 'More articles soon',
        emptyText: 'New explainers and updates will appear here as our projects progress.',
        prevLabel: 'Prev',
        nextLabel: 'Next',
      },
    },
    {
      key: 'cta',
      order: 3,
      content: {
        eyebrow: 'LET’S TALK',
        lines: ['Let’s talk about', 'what comes next.'],
        text: 'Contact MAOUAJ Technology to discuss a product, a business inquiry or a potential partnership.',
        primary: { label: 'Contact us', href: '/contact-us' },
        secondary: { label: 'Explore products', href: '/our-products' },
      },
    },
  ],
};

/** The three posts shown on the Blog frame (Figma 19:256). The site shows each post's publishedAt ("18 Nov 2026"). */
export const blogPosts = [
  {
    id: 'seed-post-blog-bus-fare',
    slug: 'how-the-cashless-bus-fare-platform-will-work-explained',
    title: 'How the cashless bus fare platform will work',
    category: 'Product explainer',
    excerpt:
      'Passengers add balance, tap a supported transit card on the bus and receive a clear payment result, while operators review fare records.',
    image: '/uploads/seed/blog-featured-bus.webp',
    author: 'MAOUAJ Team',
    publishedAt: '2026-12-30',
  },
  {
    id: 'seed-post-blog-payment',
    slug: 'payment-platform-introduction-steps',
    title: 'An introduction to the payment platform',
    category: 'Product explainer',
    excerpt: 'A look at the intended steps for sending money, reviewing costs and following a transfer’s progress.',
    image: '/uploads/seed/blog-payment.webp',
    author: 'MAOUAJ Team',
    publishedAt: '2026-12-29',
  },
  {
    id: 'seed-post-blog-company-news',
    slug: 'maouaj-technologys-current-projects-and-future-plans',
    title: 'MAOUAJ Technology’s current projects and future plans',
    category: 'Company News',
    excerpt: 'Our current priorities in bus fares and payments, and what comes next in ride-hailing and e-commerce.',
    image: '/uploads/seed/blog-laptop.webp',
    author: 'MAOUAJ Team',
    publishedAt: '2026-12-28',
  },
];

export default blog;
