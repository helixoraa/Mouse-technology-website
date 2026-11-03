import type { PageSeed } from './types.js';

/** Our Products frame (Figma 19:533). Illustration images are in server/seed-media. */
const products: PageSeed = {
  page: 'products',
  seo: {
    title: 'Our Products | MAOUAJ Technology',
    description:
      'Two products in development for everyday transport and payments: the Cashless Bus Fare Platform and the Payment / Money Transfer Platform.',
  },
  sections: [
    {
      key: 'hero',
      order: 1,
      content: {
        eyebrow: 'OUR PRODUCTS',
        title: [{ text: 'What our ' }, { text: 'products', accent: true }, { text: ' ' }, { text: 'do', accent: true }, { text: '.' }],
        lead: 'Two products in development for everyday transport and payments, with more technology products planned.',
      },
    },
    {
      key: 'busFare',
      order: 2,
      content: {
        tone: 'soft',
        status: 'In development',
        title: [{ text: 'Cashless ' }, { text: 'Bus Fare', accent: true }, { text: ' Platform' }],
        subtitle: 'A simpler way to pay for the bus.',
        description:
          'Passengers pay their bus fare with a supported transit card. The system connects the card with a balance record, processes the fare when the passenger taps, and provides transaction information for passengers and bus operators.',
        listTitle: 'WHAT WE ARE GOING TO DEVELOP',
        items: [
          {
            title: 'Passenger cards and balances',
            text: 'Register or link a supported transit card and keep its balance and transaction records.',
          },
          {
            title: 'Fare payments',
            text: 'Process the agreed fare when a card is presented to a supported reader, with a clear payment outcome.',
          },
          { title: 'Balance top-ups', text: 'Add balance through the supported top-up process.' },
          { title: 'Passenger information', text: 'Secure access to your own balance and transaction history.' },
          {
            title: 'Operator tools',
            text: 'Manage route and vehicle information, review fare transactions and check daily revenue and reconciliation records.',
          },
        ],
        animation: {
          src: '/animations/bus-fare.svg',
          staticImage: '/animations/bus-fare-static.webp',
          alt: 'Transit card tapped on a phone reader showing a $2.75 fare paid, alongside the card balance and recent trips',
        },
        imageWidth: 752,
        imageHeight: 426,
        journeyTitle: 'PASSENGER JOURNEY',
        steps: ['Add balance', 'Tap the supported transit card on the bus', 'Receive the transaction result', 'Review balance and history'],
      },
    },
    {
      key: 'payment',
      order: 3,
      content: {
        tone: 'white',
        status: 'In development',
        title: [{ text: 'Payment / ' }, { text: 'Money Transfer', accent: true }, { text: ' Platform' }],
        subtitle: 'A clear and convenient way to send money.',
        description:
          'A digital payment and money-transfer product that helps users send money through a straightforward process, with the transfer steps, transaction information and progress easy to understand.',
        listTitle: 'PLANNED CAPABILITIES',
        items: [
          { title: 'User accounts', text: 'Sign up and manage your details.' },
          { title: 'Recipient details', text: 'Add who the money is going to.' },
          { title: 'Transfer amount entry', text: 'Enter how much you want to send.' },
          { title: 'Review of details and charges', text: 'See the transaction details and applicable charges before you confirm.' },
          { title: 'Confirmation, status and history', text: 'Confirm the transfer, follow its status and revisit past transactions.' },
        ],
        animation: {
          src: '/animations/global-transfer.svg',
          staticImage: '/animations/global-transfer-static.webp',
          alt: 'Globe showing live transfers, including $2,300.00 to New York and R12,800 to Johannesburg, both delivered',
        },
        imageWidth: 752,
        imageHeight: 627,
        journeyTitle: 'INTENDED USER JOURNEY',
        steps: ['Choose a recipient', 'Enter the amount', 'Review the transaction details', 'Confirm the transfer', 'Follow its status'],
      },
    },
    {
      key: 'planned',
      order: 4,
      content: {
        title: [{ text: 'More technology ' }, { text: 'to come', accent: true }],
        subtitle: 'Planned technology products',
        description: 'Beyond our two main platforms, we are planning ride-hailing and e-commerce services.',
        items: [
          { title: 'Ride-Hailing Platform', status: 'Planned', text: 'A future service connecting riders and drivers.' },
          {
            title: 'E-commerce Platform',
            status: 'Planned',
            text: 'A future digital commerce service connecting customers with products and sellers.',
          },
        ],
      },
    },
    {
      key: 'cta',
      order: 5,
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

export default products;
