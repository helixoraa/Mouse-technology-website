import type { PageSeed } from './types.js';

/**
 * Homepage frame (Figma 1:2). Every string below is the exact text from the frame.
 * Section keys map to components in client/src/components/sections/Home.
 * FAQs, blog cards and site contact details come from their own collections / site settings.
 * Images are seeded from server/seed-media (served at /uploads/seed/<file>).
 */
const home: PageSeed = {
  page: 'home',
  seo: {
    title: 'MAOUAJ Technology | Technology for the way people move, pay and trade',
    description: 'Digital platforms for cashless bus fares and clearer money transfers, with ride-hailing and e-commerce planned next.',
  },
  sections: [
    {
      key: 'hero',
      order: 1,
      content: {
        headline: [{ text: 'Technology for the way people ' }, { text: 'move, pay', accent: true }, { text: ' and trade' }],
        lead: 'Digital platforms for cashless bus fares and clearer money transfers, with ride-hailing and e-commerce planned next.',
        primaryCta: { label: 'Explore our products', href: '/our-products' },
        secondaryCta: { label: 'Contact Us', href: '/contact-us' },
        floatingChip: 'Tap → result in a moment',
        phone: {
          time: '9:41',
          title: 'Transit',
          resultTitle: 'Fare accepted',
          resultText: 'Payment recorded',
          balanceLabel: 'Remaining balance',
          balance: '320.00',
          recentTitle: 'Recent fares',
          rows: [
            { label: 'Route tap', status: 'Accepted' },
            { label: 'Top-up', status: 'Added' },
            { label: 'Route tap', status: 'Accepted' },
          ],
        },
        card: { label: 'TRANSIT CARD', brand: 'MAOUAJ', tap: 'Tap to pay' },
        transfer: {
          title: 'Transfer review',
          status: 'Processing',
          rows: [
            { label: 'Recipient', value: 'Added' },
            { label: 'Fees & total', value: 'Shown before confirm' },
          ],
          steps: ['Paid', 'Processing', 'Delivered'],
        },
      },
    },
    {
      key: 'products',
      order: 2,
      content: {
        title: [{ text: 'Our ' }, { text: 'Products', accent: true }],
        intro:
          'Two products are currently in development. Details on markets, payment methods and availability will be announced when confirmed.',
        items: [
          {
            key: 'bus',
            title: 'Cashless Bus Fare Platform',
            text: 'Passengers add balance, tap a supported transit card on the bus reader and see a clear result. Operators review fare transactions and daily collection records.',
            journey: ['Add balance', 'Tap on the bus', 'See the result', 'Review history'],
            features: [
              'Transit cards linked to balances and history',
              'Fare results shown clearly at the reader',
              'Route, vehicle and collection records for operators',
            ],
            note: 'The initial product uses supported transit cards. Participating services and top-up options will be announced when confirmed.',
            cta: { label: 'Learn more', href: '/our-products' },
            visual: {
              operatorTitle: 'Operator view',
              operatorText: 'Daily collection records',
              readerStatus: 'Accepted',
              readerHint: 'Tap card here',
              cardLabel: 'TRANSIT CARD',
              cardBrand: 'MAOUAJ',
            },
          },
          {
            key: 'payment',
            title: 'Payment & Money Transfer Platform',
            text: 'A clear and convenient way to send money. Enter the recipient and amount, review transaction details and applicable charges, then confirm and follow the status of every transfer.',
            journey: ['Recipient', 'Amount', 'Review', 'Confirm', 'Track'],
            features: [
              'Transfer details reviewed before you confirm',
              'Status tracking and transaction history',
              'A reference to use when you need help',
            ],
            note: 'Supported markets, currencies, payment and delivery options, pricing and launch availability will be announced when confirmed.',
            cta: { label: 'Learn more', href: '/our-products' },
            visual: {
              panelTitle: 'Review your transfer',
              panelStatus: 'Ready',
              rows: [
                { label: 'Recipient', value: 'Details added' },
                { label: 'Amount to send', value: 'Entered by sender' },
                { label: 'Applicable fees', value: 'Shown before confirming' },
                { label: 'Total to pay', value: 'Clear before you pay' },
                { label: 'Estimated delivery', value: 'Shown before confirming' },
              ],
              confirm: 'Confirm and pay',
              trackerTitle: 'Transfer status',
              trackerSteps: ['Awaiting payment', 'Processing', 'Completed'],
            },
          },
        ],
      },
    },
    {
      key: 'busfare',
      order: 3,
      content: {
        title: [{ text: 'Cashless ' }, { text: 'Bus Fare', accent: true }, { text: ' Platform' }],
        lead: 'Passengers tap a supported transit card; the system processes the fare and gives clear transaction information.',
        animation: {
          src: '/animations/bus-fare.svg',
          staticImage: '/animations/bus-fare-static.webp',
          alt: 'Animation: a passenger taps a transit card, the fare is paid and the card balance updates',
        },
        cards: [
          { title: 'Cards & balances', text: 'Link a supported transit card, add balance and review your transaction history.' },
          { title: 'Fare payments', text: 'Tap the card on a supported reader and get a clear result.' },
          { title: 'Operator tools', text: 'Manage routes and vehicles, review fares and daily revenue.' },
        ],
      },
    },
    {
      key: 'payment',
      order: 4,
      content: {
        title: [{ text: 'Payment / ' }, { text: 'Money Transfer', accent: true }],
        lead: 'A payment product that makes transfer steps, transaction information and progress easy to follow.',
        animation: {
          src: '/animations/global-transfer.svg',
          staticImage: '/animations/global-transfer-static.webp',
          alt: 'Animation: money transfers delivered around the world on a dotted globe',
        },
        steps: [
          { no: '01', label: 'Choose a recipient' },
          { no: '02', label: 'Enter the amount' },
          { no: '03', label: 'Review details and charges' },
          { no: '04', label: 'Confirm and follow its status' },
        ],
      },
    },
    {
      key: 'focus',
      order: 5,
      content: {
        title: [{ text: 'Our ' }, { text: 'Focus', accent: true }],
        subtitle: 'Practical technology for everyday movement, payments and trade.',
        description:
          'We focus on the activities people and businesses rely on every day: travelling, paying for services, transferring money and buying or selling goods.',
        pillars: [
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
      key: 'projects',
      order: 6,
      content: {
        title: [{ text: 'Our ' }, { text: 'Portfolio', accent: true }],
        lead: 'New platforms we are planning and businesses we already run.',
        items: [
          { icon: 'ride', title: 'Ride-Hailing Platform', text: 'A future service connecting riders and drivers.', textWidth: 380 },
          {
            icon: 'ecommerce',
            title: 'E-commerce Platform',
            text: 'A  service connecting customers with products and sellers.',
            textWidth: 485,
          },
          {
            icon: 'textile',
            title: 'Textile business',
            text: 'Our textile offering and its place in the wider portfolio.',
            textWidth: 380,
          },
          {
            icon: 'retail',
            title: 'HussainandMuallima.com',
            text: 'Our existing online retail business and what it offers customers.',
            textWidth: 439,
          },
        ],
      },
    },
    {
      key: 'faq',
      order: 7,
      content: {
        titleLines: [
          { text: 'Frequently', accent: true },
          { text: 'asked questions', accent: false },
        ],
        lead: 'Short answers about availability while both products are in development.',
      },
    },
    {
      key: 'blog',
      order: 8,
      content: {
        title: [{ text: 'Blog & ' }, { text: 'Updates', accent: true }],
        lead: 'Product explanations, project progress and company news.',
        postSlugs: [
          'how-the-cashless-bus-fare-platform-will-work',
          'an-introduction-to-the-payment-platform',
          'an-introduction-to-the-payment-platform-2',
        ],
        linkLabel: 'View all updates',
        linkHref: '/blog',
      },
    },
    {
      key: 'cta',
      order: 9,
      content: {
        eyebrow: 'LET’S TALK',
        lines: ['Let’s talk about', 'what comes next.'],
        text: 'Contact MAOUAJ Technology to discuss a product, a business inquiry or a potential partnership.',
        primary: { label: 'Contact us', href: '/contact-us' },
        secondary: { label: 'Explore products', href: '/our-products' },
      },
    },
    {
      key: 'contact',
      order: 10,
      content: {
        title: [{ text: 'Contact', accent: true }, { text: ' Us' }],
        lead: 'Product questions, business inquiries or partnerships — tell us which area interests you and how we can help.',
        details: [
          { icon: 'email', label: 'Email', field: 'email' },
          { icon: 'phone', label: 'Telephone', field: 'phone' },
          { icon: 'address', label: 'Address', field: 'address' },
        ],
        form: {
          title: 'Send us an inquiry',
          fields: {
            name: { label: 'Full name', placeholder: 'Your full name' },
            email: { label: 'Email', placeholder: 'you@company.com' },
            phone: { label: 'Phone (optional)', placeholder: '+92 …' },
            organisation: { label: 'Organisation (optional)', placeholder: 'Company or agency' },
            interest: {
              label: 'Area of interest',
              placeholder: 'Select an area',
              options: [
                'Cashless Bus Fare Platform',
                'Payment / Money Transfer Platform',
                'Ride-Hailing Platform',
                'E-commerce Platform',
                'Textile business',
                'HussainandMuallima.com',
                'Partnership',
                'Other',
              ],
            },
            message: { label: 'Message', placeholder: 'Tell us how we can help' },
          },
          consent: 'I agree to the Privacy Policy and consent to MAOUAJ Technology contacting me.',
          submit: 'Send inquiry',
          successTitle: 'Thank you',
          successText: 'Your inquiry has been sent. We will be in touch soon.',
        },
      },
    },
  ],
};

export default home;
