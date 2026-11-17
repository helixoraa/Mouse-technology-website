import type { PageSeed } from './types.js';

/** Privacy Policy (Figma 19:2 layout). The policy text is the client-approved version, effective 16 November 2026. */
const privacy: PageSeed = {
  page: 'privacy',
  seo: {
    title: 'Privacy Policy | MAOUAJ Technology',
    description: 'Understand how information shared through the MAOUAJ Technology website is collected, used and handled.',
  },
  sections: [
    {
      key: 'hero',
      order: 1,
      content: {
        eyebrow: 'MAOUAJ  /  PRIVACY POLICY',
        title: [{ text: 'Your ' }, { text: 'privacy,', accent: true }, { text: '\nour responsibility.' }],
        lead: 'Understand how information shared through the MAOUAJ Technology website is collected, used and handled.',
      },
    },
    {
      key: 'policy',
      order: 2,
      // Client-approved text (effective 16 November 2026), docs/legal/privacy-policy.md. Blocks use the
      // RichText subset: **bold**, [label](/path), "- " lists.
      content: {
        heading: 'Privacy Policy',
        intro: [
          '**Effective date:** 16 November 2026',
          'This Privacy Policy explains how MAOUAJ Technology, meaning Grupo Maouaj S.A. (Guatemala) and Maouaj Technology Corporation (USA) ("MAOUAJ Technology", "we", "us" or "our") collects, uses, shares and protects information when you visit our website or contact us through it.',
          'This website is a corporate information website. It does not offer user accounts, online purchases or payments.',
        ],
        sidebarTitle: 'ON THIS PAGE',
        articles: [
          {
            number: '01',
            title: 'Information we collect',
            paragraphs: [
              '**Information you give us.** When you send an inquiry through our contact form, we collect:',
              '- your name\n- your email address\n- the area you are interested in (for example, a product, a business inquiry or a partnership)\n- your phone number and organization, if you choose to give them (optional)\n- the message you write',
              'If you email or call us directly, we receive the information you choose to share in that email or call.',
              '**Information collected automatically.** When you visit the website, our hosting and infrastructure providers automatically record standard technical information, such as your IP address, browser type, device type, the pages you visit, the date and time of your visit and the referring website. This information is used to deliver the website, keep it secure and fix problems.',
              '**Cookies.** The website uses only cookies and similar technologies that are necessary for it to work and stay secure. We do not use advertising or tracking cookies. If we introduce analytics or other non-essential cookies in the future, we will update this policy and, where required, ask for your consent first.',
            ],
          },
          {
            number: '02',
            title: 'How we use your information',
            paragraphs: [
              'We use the information described above to:',
              '- respond to your inquiry and continue the conversation you started\n- consider business inquiries and partnership proposals\n- operate, maintain, secure and improve the website\n- detect and prevent spam, abuse and security incidents\n- comply with legal obligations and protect our legal rights',
              'We do not sell your personal information, and we do not use it for automated decision-making.',
            ],
          },
          {
            number: '03',
            title: 'Legal bases for processing',
            paragraphs: [
              'Where data protection laws require a legal basis, we rely on:',
              '- **your consent**, when you choose to send us an inquiry\n- **our legitimate interests** in responding to inquiries, running and securing our website, and developing our business\n- **legal obligations**, where we must keep or disclose information by law',
            ],
          },
          {
            number: '04',
            title: 'Who we share information with',
            paragraphs: [
              'We share personal information only with service providers that help us run the website and handle inquiries, such as website hosting, database, file storage and email providers. They may process information only on our instructions and must protect it.',
              'We may also disclose information if required by law, to protect our rights or the safety of others, or as part of a merger, acquisition or sale of all or part of our business.',
            ],
          },
          {
            number: '05',
            title: 'International transfers',
            paragraphs: [
              'We have offices in more than one country, and our service providers may store or process information in other countries, including the United States. Where we transfer personal information internationally, we take reasonable steps to make sure it remains protected in line with this policy and applicable law.',
            ],
          },
          {
            number: '06',
            title: 'How long we keep information',
            paragraphs: [
              'We keep inquiry information for as long as needed to respond to you and follow up, and in any case no longer than 24 months after our last contact, unless we need to keep it longer for legal reasons or an ongoing business relationship. Technical logs are kept for the limited periods set by our hosting providers.',
            ],
          },
          {
            number: '07',
            title: 'How we protect information',
            paragraphs: [
              'We use reasonable technical and organizational measures to protect personal information, including encrypted connections (HTTPS) and restricted access to inquiry data. No method of transmission or storage is completely secure, so we cannot guarantee absolute security.',
            ],
          },
          {
            number: '08',
            title: 'Your rights and choices',
            paragraphs: [
              'Depending on where you live, you may have the right to:',
              '- ask what personal information we hold about you and request a copy\n- ask us to correct inaccurate information\n- ask us to delete your information\n- object to or ask us to restrict certain processing\n- withdraw your consent at any time, where we rely on consent\n- complain to your local data protection authority\n- confirm that we do not sell or share your personal information for cross-context behavioral advertising, as described under US state privacy laws such as those of California and New York',
              'To make a request, contact us using the details below. We may need to verify your identity before acting on it. We will not treat you differently for exercising your rights.',
            ],
          },
          {
            number: '09',
            title: 'Children',
            paragraphs: [
              'This website is not directed at children under 13 (or under 16 in certain jurisdictions, such as the European Economic Area), and we do not knowingly collect personal information from them. If you believe a child has sent us information, please contact us and we will delete it.',
            ],
          },
          {
            number: '10',
            title: 'Links to other websites',
            paragraphs: [
              'Our website links to external websites, including websites of businesses connected with MAOUAJ Technology. We are not responsible for the privacy practices of those websites. Please read their privacy policies.',
            ],
          },
          {
            number: '11',
            title: 'Changes to this policy',
            paragraphs: [
              'We may update this policy from time to time. The updated version will be posted on this page with a new effective date. If the changes are significant, we will make that clear on the website.',
            ],
          },
          {
            number: '12',
            title: 'Contact us',
            paragraphs: [
              'For privacy questions or requests, contact us:',
              '- **Email:** info@maouajtechnology.com\n- **Guatemala:** Grupo Maouaj S.A., 3ra Calle E 14-70, Sector B7, San Cristobal II, Zona 8 De Mixco, Guatemala. Phone: +502-51850811\n- **USA:** Maouaj Technology Corporation, The Broadway Market, 999 Broadway, Buffalo, NY 14212, USA. Phone: +1 (716) 533-2271',
            ],
          },
        ],
      },
    },
  ],
};

export default privacy;
