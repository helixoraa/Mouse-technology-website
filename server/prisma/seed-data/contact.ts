import type { PageSeed } from './types.js';

/** Contact Us frame (Figma 19:741). */
const contact: PageSeed = {
  page: 'contact',
  seo: {
    title: 'Contact Us | MAOUAJ Technology',
    description: 'Contact MAOUAJ Technology to discuss a product, a business inquiry or a potential partnership.',
  },
  sections: [
    {
      key: 'hero',
      order: 1,
      content: {
        eyebrow: 'CONTACT US',
        title: [{ text: 'Let’s talk about our products and ' }, { text: 'what comes next.', accent: true }],
        lead: 'Contact MAOUAJ Technology to discuss a product, a business inquiry or a potential partnership.',
      },
    },
    {
      key: 'topics',
      order: 2,
      content: {
        items: [
          {
            number: '01',
            title: 'Product questions',
            text: 'Ask about the cashless bus fare platform or the payment and money-transfer platform.',
          },
          {
            number: '02',
            title: 'Business inquiries',
            text: 'Talk to us about our projects, planned initiatives and wider business interests.',
          },
          { number: '03', title: 'Partnerships', text: 'Tell us how you would like to work with MAOUAJ Technology.' },
        ],
      },
    },
    {
      key: 'details',
      order: 3,
      content: {
        eyebrow: 'BUSINESS DETAILS',
        title: 'Reach MAOUAJ Technology directly.',
        emailLabel: 'EMAIL',
        phoneLabel: 'TELEPHONE',
        addressLabel: 'OTHER DETAILS',
      },
    },
    {
      key: 'form',
      order: 4,
      content: {
        title: 'Send us an inquiry',
        fields: {
          name: { label: 'Name', placeholder: 'Your name' },
          email: { label: 'Email', placeholder: 'you@example.com' },
          phone: { label: 'Phone(Optional)', placeholder: '+92...' },
          organisation: { label: 'Organization(Optional)', placeholder: 'xyz@example.com' },
          interest: {
            label: 'Area of interest',
            placeholder: 'Select an area',
            options: ['Product questions', 'Business inquiries', 'Partnerships'],
          },
          message: { label: 'Message', placeholder: 'Tell us how we can help' },
        },
        submit: 'Send inquiry',
        successTitle: 'Thank you',
        successText: 'Your inquiry has been sent. We will be in touch soon.',
      },
    },
  ],
};

export default contact;
