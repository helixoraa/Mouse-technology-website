import type { PageSeed } from './types.js';
import { talkCta } from './shared-inner.js';

/** Our Projects frame (Figma 19:380). Project cards come from the Service collection (categories product / planned / business). */
const projects: PageSeed = {
  page: 'projects',
  seo: {
    title: 'Our Projects | MAOUAJ Technology',
    description:
      'Our current development priorities are cashless bus fares and digital payments, with ride-hailing and broader digital commerce planned.',
  },
  sections: [
    {
      key: 'hero',
      order: 1,
      content: {
        eyebrow: 'Our Projects',
        title: [{ text: 'Technology projects and ' }, { text: 'business interests.', accent: true }],
        lead: 'Our current development priorities are cashless bus fares and digital payments. Our future plans extend into ride-hailing and broader digital commerce.',
      },
    },
    {
      key: 'main',
      order: 2,
      content: {
        header: {
          title: [{ text: 'Main ' }, { text: 'development', accent: true }, { text: ' projects' }],
          subtitle: 'Two products in development',
          description: 'The cashless bus fare and payment platforms are our current development priorities.',
        },
      },
    },
    {
      key: 'planned',
      order: 3,
      content: {
        header: {
          title: [{ text: 'Planned', accent: true }, { text: ' initiatives' }],
          subtitle: 'Future ride-hailing and e-commerce',
          description: 'Future initiatives, each developed around its own distinctive service proposition.',
        },
      },
    },
    {
      key: 'existing',
      order: 4,
      content: {
        header: {
          title: [{ text: 'Existing ' }, { text: 'businesses', accent: true }],
          subtitle: 'Our wider business portfolio',
          description: 'Established businesses that sit alongside our technology projects.',
        },
      },
    },
    { key: 'cta', order: 5, content: talkCta },
  ],
};

export default projects;
