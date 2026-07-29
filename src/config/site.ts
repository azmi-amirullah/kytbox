import { env } from '@/env';

const baseUrl =
  process.env.NODE_ENV === 'production'
    ? env.NEXT_PUBLIC_SITE_URL || 'https://kytbox.com'
    : 'http://localhost:3000';

export const siteConfig = {
  name: 'Kytbox',
  description:
    'Kytbox brings Bio, Cashflow, and List into one calm workspace - so you spend less time switching between tools.',
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
