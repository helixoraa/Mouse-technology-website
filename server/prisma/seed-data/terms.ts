import type { PageSeed } from './types.js';

/** Terms of Use frame (Figma 19:129). Bracketed text is the draft placeholder copy from the design. */
const terms: PageSeed = {
  page: 'terms',
  seo: {
    title: 'Terms of Use | MAOUAJ Technology',
    description: 'A straightforward guide to using the MAOUAJ website, its content and external links.',
  },
  sections: [
    {
      key: 'hero',
      order: 1,
      content: {
        eyebrow: 'MAOUAJ  /  TERMS OF USE',
        title: [{ text: 'A clearer way\nto understand our ' }, { text: 'terms', accent: true }, { text: '.' }],
        lead: 'A straightforward guide to using the MAOUAJ website, its content and external links.',
      },
    },
    {
      key: 'policy',
      order: 2,
      content: {
        title: 'Understand the essentials.',
        intro: 'A clear overview of the sections below. Please review all draft legal details before publishing.',
        sidebarTitle: 'ON THIS PAGE',
        articles: [
          {
            number: '01',
            title: 'About this website',
            paragraphs: [
              'This corporate website introduces MAOUAJ Technology, its products, projects and business interests. Website materials are provided for general information and should not be treated as a binding offer or product commitment.',
            ],
          },
          {
            number: '02',
            title: 'Product information',
            paragraphs: [
              'The Cashless Bus Fare Platform and Payment / Money Transfer Platform are described as being in development. Planned products, features, timelines and availability may change.',
              'Specific services may be subject to separate terms if and when they become available.',
            ],
          },
          {
            number: '03',
            title: 'Content and intellectual property',
            paragraphs: [
              'Website design, copy, graphics, branding and other materials may be protected by intellectual property rights. No licence or ownership interest is granted merely by visiting this website.',
              '[Confirm the legal entity, attribution and permitted use or sharing terms.]',
            ],
          },
          {
            number: '04',
            title: 'Acceptable website use',
            paragraphs: [
              'Use the website lawfully and do not interfere with its operation, attempt unauthorised access, scrape or misuse its content, or send unlawful or misleading material through its inquiry forms.',
            ],
          },
          {
            number: '05',
            title: 'External websites and links',
            paragraphs: [
              'This website may contain links to services or websites operated by third parties. Those third parties control their own content and privacy practices. Review their policies before using external websites.',
            ],
          },
          {
            number: '06',
            title: 'Availability, changes and contact',
            paragraphs: [
              'The website’s content may be revised or withdrawn without notice. Questions about these terms can be directed through the Contact Us page.',
              '[Confirm disclaimers, limitations of liability, governing law, effective date and official legal contact.]',
            ],
          },
        ],
      },
    },
  ],
};

export default terms;
