import { env } from '@/env';

const baseUrl =
  env.NODE_ENV === 'production'
    ? env.NEXT_PUBLIC_SITE_URL || 'https://kytbox.com'
    : 'http://localhost:3000';

export const siteConfig = {
  name: 'Kytbox',
  description:
    'Your personal kit box. One account, multiple tools. Bio, cashflow, lists, tracking & more — all in one place.',
  url: baseUrl,
  ogImage: `${baseUrl}/og.png`,
  links: {
    github: 'https://github.com/azmi-amirullah/kytbox',
    twitter: 'https://twitter.com/azmi_amirullah',
    creatorGithub: 'https://github.com/azmi-amirullah',
    creatorLinkedin: 'https://www.linkedin.com/in/azmi-amirullah',
    creatorPortfolio: 'https://azmi-dev.vercel.app',
    cv: '/CV/CV.pdf',
  },
  creator: 'Azmi',
  labels: {
    github: 'GitHub',
    linkedin: 'LinkedIn',
    portfolio: 'Portfolio',
    downloadCv: 'Download CV',
  },
};

