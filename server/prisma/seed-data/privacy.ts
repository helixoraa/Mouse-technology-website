import type { PageSeed } from './types.js';

/** Privacy Policy frame (Figma 19:2). Text read from the frame render; bracketed items are the draft placeholders from the design. */
const privacy: PageSeed = {
  page: 'privacy',
  seo: {
    title: 'Privacy Policy | MAOUAJ Technology',
    description: 'Understand how information shared through the MAOUAJ website is collected, used and handled.',
  },
  sections: [
    {
      key: 'hero',
      order: 1,
      content: {
        eyebrow: 'MAOUAJ  /  PRIVACY POLICY',
        title: [{ text: 'Your ' }, { text: 'privacy,', accent: true }, { text: '\nour responsibility.' }],
        lead: 'Understand how information shared through the MAOUAJ website is collected, used and handled.',
      },
    },
    {
      key: 'policy',
      order: 2,
      content: {
        heading: 'Understand the essentials.',
        intro: 'A clear overview of the sections below. Please review all draft legal details before publishing.',
        sidebarTitle: 'ON THIS PAGE',
        articles: [
          {
            number: '01',
            title: 'Information we collect',
            paragraphs: [
              'When you submit an inquiry through this website, the information you provide may include your name, business email, phone number, organisation, area of interest and message.',
              "[Confirm the website's actual collection of cookies, analytics identifiers, IP addresses and device information before publication.]",
            ],
          },
          {
            number: '02',
            title: 'How we use information',
            paragraphs: [
              'Inquiry details are used to review and respond to product questions, business requests and potential partnership opportunities.',
              '[Confirm any additional uses, including marketing, measurement, security monitoring and website improvement.]',
            ],
          },
          {
            number: '03',
            title: 'Sharing and service providers',
            paragraphs: [
              'Website hosting, form delivery, email and analytics providers may help operate the website and process inquiries on our behalf.',
              '[List the actual providers, data locations and categories of data shared. Do not publish this description until verified.]',
            ],
          },
          {
            number: '04',
            title: 'Retention and security',
            paragraphs: [
              'Information should be retained only for defined business or legal purposes. Appropriate safeguards should be used to protect information against unauthorised access or disclosure.',
              '[Insert actual retention periods, deletion procedures and security practices.]',
            ],
          },
          {
            number: '05',
            title: 'Your privacy choices',
            paragraphs: [
              'You may contact MAOUAJ Technology with questions about information provided through the website. The available rights and request process depend on the law that applies to you.',
              '[Confirm access, correction, deletion, withdrawal and cookie choices, plus the response process.]',
            ],
          },
          {
            number: '06',
            title: 'Contact and updates',
            paragraphs: [
              'For privacy questions, contact MAOUAJ Technology through the Contact Us page. This policy may be updated when practices change.',
              '[Insert the privacy contact email, legal entity, jurisdiction and effective date.]',
            ],
          },
        ],
      },
    },
  ],
};

export default privacy;
