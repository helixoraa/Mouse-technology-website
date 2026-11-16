import type { PageSeed } from './types.js';

/** Terms of Use (Figma 19:129 layout). The terms text is the client-approved version, effective 16 November 2026. */
const terms: PageSeed = {
  page: 'terms',
  seo: {
    title: 'Terms of Use | MAOUAJ Technology',
    description: 'A straightforward guide to using the MAOUAJ Technology website, its content and external links.',
  },
  sections: [
    {
      key: 'hero',
      order: 1,
      content: {
        eyebrow: 'MAOUAJ  /  TERMS OF USE',
        title: [{ text: 'A clearer way\nto understand our ' }, { text: 'terms', accent: true }, { text: '.' }],
        lead: 'A straightforward guide to using the MAOUAJ Technology website, its content and external links.',
      },
    },
    {
      key: 'policy',
      order: 2,
      // Client-approved text (effective 16 November 2026), docs/legal/terms-of-use.md. Blocks use the
      // RichText subset: **bold**, [label](/path), "- " lists.
      content: {
        title: 'Terms of Use',
        intro: [
          '**Effective date:** 16 November 2026',
          'These Terms of Use ("Terms") govern your use of the MAOUAJ Technology website (the "website"). By using the website, you agree to these Terms. If you do not agree, please do not use the website.',
        ],
        sidebarTitle: 'ON THIS PAGE',
        articles: [
          {
            number: '01',
            title: 'About this website',
            paragraphs: [
              'The website is operated by MAOUAJ Technology ("MAOUAJ Technology", "we", "us" or "our"). It provides general information about our company, our technology products and projects, and the business interests connected with us.',
              'The website is for information only. Nothing on it is an offer to sell, a contract, or financial, legal or professional advice.',
            ],
          },
          {
            number: '02',
            title: 'Products in development',
            paragraphs: [
              'Several products described on the website, including the Cashless Bus Fare Platform and the Payment / Money Transfer Platform, are **in development**. Others, such as the Ride-Hailing Platform and the E-commerce Platform, are **planned**.',
              'Descriptions of these products explain what we intend to build. They are not promises that a product will be released, released on a particular date, available in a particular country, or include any particular feature, payment method or price. Product scope, availability and service terms may change, and they will be published separately when a product launches.',
            ],
          },
          {
            number: '03',
            title: 'Ownership of content',
            paragraphs: [
              'All content on the website, including text, graphics, logos, images, designs and the arrangement of that content, belongs to MAOUAJ Technology or is used with permission, and is protected by intellectual property laws.',
              'You may view the website and print or save pages for your own personal, non-commercial reference. You may not copy, reproduce, modify, distribute, publish or use any content for commercial purposes without our prior written permission.',
              'Names and logos of MAOUAJ Technology and connected businesses are trademarks or trade names of their owners. Nothing on the website gives you a right to use them.',
            ],
          },
          {
            number: '04',
            title: 'Acceptable use',
            paragraphs: [
              'When using the website, you agree not to:',
              '- use it in any way that breaks applicable law\n- send false, misleading, offensive or unlawful information through our contact form\n- send spam, advertising or unsolicited bulk messages\n- attempt to gain unauthorised access to the website, its servers or any connected system\n- introduce viruses, malware or other harmful code\n- disrupt or overload the website, or use automated tools to scrape or copy it at scale',
              'We may restrict access to the website for anyone who breaks these rules.',
            ],
          },
          {
            number: '05',
            title: 'Inquiries you send us',
            paragraphs: [
              'When you contact us, you confirm that the information you send is accurate and that you are entitled to share it. Please do not send confidential information through the contact form. Sending an inquiry does not create a business relationship or any obligation on either side.',
              'How we handle the personal information in your inquiry is explained in our [Privacy Policy](/privacy-policy).',
            ],
          },
          {
            number: '06',
            title: 'External links',
            paragraphs: [
              'The website contains links to external websites, including websites of businesses connected with MAOUAJ Technology. These links are provided for convenience. We do not control those websites and are not responsible for their content, availability, products or privacy practices. Visiting them is at your own risk and subject to their own terms.',
            ],
          },
          {
            number: '07',
            title: 'Accuracy and availability',
            paragraphs: [
              'We work to keep the website accurate and up to date, but we do not guarantee that all information is complete, current or free of errors. The website is provided "as is" and "as available". We may change, suspend or remove any part of it at any time without notice.',
            ],
          },
          {
            number: '08',
            title: 'Limitation of liability',
            paragraphs: [
              'To the fullest extent permitted by law, MAOUAJ Technology is not liable for any indirect, incidental or consequential loss, or for any loss of data, profit or business, arising from your use of, or inability to use, the website or any linked website. Nothing in these Terms excludes or limits liability that cannot be excluded or limited by law.',
            ],
          },
          {
            number: '09',
            title: 'Changes to these Terms',
            paragraphs: [
              'We may update these Terms from time to time. The updated version will be posted on this page with a new effective date. Continuing to use the website after a change means you accept the updated Terms.',
            ],
          },
          {
            number: '10',
            title: 'Governing law',
            paragraphs: [
              'These Terms are governed by the laws of the country in which MAOUAJ Technology is registered, without regard to conflict-of-law rules. Any dispute will be handled by the courts of that country, unless the law of your country of residence gives you the right to bring a claim locally.',
            ],
          },
          {
            number: '11',
            title: 'Contact us',
            paragraphs: [
              'For questions about these Terms, contact us:',
              '- **Email:** info@maouajtechnology.com\n- **Offices:** Grupo Maouaj S.A., 3ra Calle E 14-70, Sector B7, San Cristobal II, Zona 8 De Mixco, Guatemala, +502-51850811; Maouaj Technology Corporation, The Broadway Market, 999 Broadway, Buffalo, NY 14212, USA, +1 (716) 533-2271',
            ],
          },
        ],
      },
    },
  ],
};

export default terms;
