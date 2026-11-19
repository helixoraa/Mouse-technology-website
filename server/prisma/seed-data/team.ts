import type { PageSeed } from './types.js';

/**
 * Our Team frame (Figma 19:860). Team members themselves live in the TeamMember collection (collections.ts).
 * The hero lead keeps the stray leading "s" exactly as it appears in the Figma text layer.
 */
const team: PageSeed = {
  page: 'team',
  seo: {
    title: 'Our Team | MAOUAJ Technology',
    description: 'Meet the leadership and team shaping MAOUAJ Technology’s products and business portfolio.',
  },
  sections: [
    {
      key: 'hero',
      order: 1,
      content: {
        eyebrow: 'Our Team',
        title: [{ text: 'Meet the ' }, { text: 'people', accent: true }, { text: ' behind MAOUAJ Technology.' }],
        lead: 'The leadership and team shaping our products and business portfolio, introduced through their names, roles and short biographies.',
      },
    },
    {
      key: 'leadership',
      order: 2,
      content: {
        header: {
          title: [{ text: 'Our ' }, { text: 'leadership', accent: true }],
          subtitle: 'The people leading MAOUAJ Technology',
        },
        // The founder's whole photo (no crop), shown in its own shape with the name and title below it.
        image: '/uploads/seed/founder-full.webp',
        image2x: '/uploads/seed/founder-full@2x.webp',
        imageWidth: 552,
        imageHeight: 690,
        imageAlt: 'Portrait of Saleh Ahmed, Founder and CEO',
        name: 'Saleh Ahmed',
        title: 'Founder and CEO',
        paragraphs: [
          'Our work focuses on activities that people and businesses rely on every day: traveling, paying for services, transferring money and buying or selling goods.',
          'Our two main development projects are a cashless bus fare platform and a payment and money-transfer platform. We are also planning initiatives in ride-hailing and e-commerce. Our wider business interests include textiles and Hossain and Moallema, a wholesale spice and agricultural export business.',
        ],
      },
    },
    {
      key: 'team-carousel',
      order: 3,
      content: {
        header: {
          title: [{ text: 'Meet our ' }, { text: 'team', accent: true }],
          subtitle: 'The people behind our products',
        },
        prevLabel: 'Prev',
        nextLabel: 'Next',
      },
    },
  ],
};

export default team;
