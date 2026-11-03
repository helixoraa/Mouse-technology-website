import type { PageSeed } from './types.js';
import { talkCta } from './shared-inner.js';

/** Our Vision frame (Figma 19:1163). */
const vision: PageSeed = {
  page: 'vision',
  seo: {
    title: 'Our Vision | MAOUAJ Technology',
    description: 'Our ambition is to make transport, payments and commerce easier through practical technology.',
  },
  sections: [
    {
      key: 'hero',
      order: 1,
      content: {
        eyebrow: 'Our Vision',
        title: [{ text: 'Making everyday movement, payments and commerce ' }, { text: 'easier', accent: true }, { text: '.' }],
        lead: 'Our ambition is to make transport, payments and commerce easier through practical technology.',
      },
    },
    {
      key: 'vision-mission',
      order: 2,
      content: {
        vision: {
          label: 'Our Vision',
          text: 'To make everyday movement, payments and commerce easier to access and simpler to use through practical digital technology.',
        },
        mission: {
          label: 'Our Mission',
          text: 'To develop useful technology products that address everyday needs for people and businesses, beginning with cashless bus travel and digital money transfers.',
        },
      },
    },
    {
      key: 'pillars',
      order: 3,
      content: {
        header: {
          title: [{ text: 'Move, ' }, { text: 'pay', accent: true }, { text: ' and trade' }],
          subtitle: 'Transport, payments and commerce',
          description: 'Three everyday needs shape the products and business interests behind MAOUAJ Technology.',
        },
        items: [
          {
            icon: 'move',
            word: 'Move',
            title: 'Transportation',
            text: 'Cashless fare payments that connect passengers, balances and operators.',
          },
          { icon: 'pay', word: 'Pay', title: 'Payments', text: 'A clearer way to send money, review details and follow progress.' },
          { icon: 'trade', word: 'Trade', title: 'Commerce', text: 'Future e-commerce and an existing online retail business.' },
        ],
      },
    },
    {
      key: 'roadmap',
      order: 4,
      content: {
        header: {
          title: [{ text: 'From vision to ' }, { text: 'products', accent: true }],
          subtitle: 'Where we begin, and what comes next',
          description:
            'We are beginning with cashless bus travel and digital money transfers, with ride-hailing and e-commerce planned next.',
        },
        items: [
          {
            number: '01',
            title: 'Cashless Bus Fare Platform',
            text: 'Transit-card fare payments, passenger balances, top-ups and operating records for bus services.',
            status: 'In development',
          },
          {
            number: '02',
            title: 'Payment / Money Transfer Platform',
            text: 'A digital product intended to simplify sending money, reviewing transaction details and following transfer progress.',
            status: 'In development',
          },
          { number: '03', title: 'Ride-Hailing Platform', text: 'A future service connecting riders and drivers.', status: 'Planned' },
          {
            number: '04',
            title: 'E-commerce Platform',
            text: 'A future digital commerce service connecting customers with products and sellers.',
            status: 'Planned',
          },
        ],
      },
    },
    { key: 'cta', order: 5, content: talkCta },
  ],
};

export default vision;
