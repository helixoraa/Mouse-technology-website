import type { PageSeed } from './types.js';

/** About Us frame (Figma 19:1038). */
const about: PageSeed = {
  page: 'about',
  seo: {
    title: 'About Us | MAOUAJ Technology',
    description: 'MAOUAJ Technology is building a portfolio of products across transportation, payments and commerce.',
  },
  sections: [
    {
      key: 'hero',
      order: 1,
      content: {
        eyebrow: 'About Us',
        title: [{ text: 'Technology for the activities people ' }, { text: 'rely on every day.', accent: true }],
        lead: 'MAOUAJ Technology is building a portfolio of products across transportation, payments and commerce.',
      },
    },
    {
      key: 'who-we-are',
      order: 2,
      content: {
        heading: [{ text: 'Practical products for the things people do ' }, { text: 'every day', accent: true }, { text: '.' }],
        lead: 'Our work focuses on activities that people and businesses rely on every day: travelling, paying for services, transferring money and buying or selling goods.',
        body: 'Our two main development projects are a cashless bus fare platform and a payment and money-transfer platform. We are also planning initiatives in ride-hailing and e-commerce. Our wider business interests include textiles and online retail, including HussainandMuallima.com.',
      },
    },
    {
      key: 'areas',
      order: 3,
      content: {
        header: {
          title: [{ text: 'Areas we ' }, { text: 'work in', accent: true }],
          subtitle: 'Products, projects and business interests',
          description: 'Two products in development, two planned initiatives and two existing businesses.',
        },
        items: [
          {
            number: '01',
            status: 'In development',
            title: 'Cashless Bus Fare Platform',
            text: 'Transit-card fare payments, passenger balances, top-ups and operating records for bus services.',
          },
          {
            number: '02',
            status: 'In development',
            title: 'Payment / Money Transfer Platform',
            text: 'A digital product intended to simplify sending money, reviewing transaction details and following transfer progress.',
          },
          { number: '03', status: 'Planned', title: 'Ride-Hailing Platform', text: 'A future service connecting riders and drivers.' },
          {
            number: '04',
            status: 'Planned',
            title: 'E-commerce Platform',
            text: 'A future digital commerce service connecting customers with products and sellers.',
          },
          {
            number: '05',
            status: 'Existing business',
            title: 'Textile business',
            text: 'An existing business within the wider MAOUAJ Technology portfolio.',
          },
          {
            number: '06',
            status: 'Existing business',
            title: 'HussainandMuallima.com',
            text: 'An existing e-commerce business and part of our online retail interests.',
          },
        ],
      },
    },
    {
      key: 'purpose',
      order: 4,
      content: {
        eyebrow: 'The purpose behind our products',
        title: 'Useful technology for everyday needs, for people and businesses.',
        tags: ['Travelling', 'Paying for services', 'Transferring money', 'Buying and selling goods'],
      },
    },
  ],
};

export default about;
