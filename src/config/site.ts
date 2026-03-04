import { env } from '@/env';

export const siteConfig = {
  name: 'Kytbox',
  description:
    'Your personal kit box. One account, multiple tools. Bio, cashflow, lists, tracking & more — all in one place.',
  url: env.NEXT_PUBLIC_SITE_URL,
  ogImage: `${env.NEXT_PUBLIC_SITE_URL}/og.png`,
  links: {
    github: 'https://github.com/azmi-amirullah/kytbox',
    twitter: 'https://twitter.com/azmi_amirullah',
  },
  creator: 'Azmi',
};
