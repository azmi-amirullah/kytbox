/** @vitest-environment jsdom */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import SocialGrid from '@/features/bio/components/SocialGrid';
import { getTheme } from '@/lib/theme';

describe('SocialGrid', () => {
  const defaultTheme = getTheme('default');

  it('renders social icons in the Appearance tab order (instagram -> tiktok -> twitter -> youtube -> linkedin -> whatsapp)', () => {
    // Intentionally pass keys in reverse order to test sorting
    const socialLinks = {
      whatsapp: 'https://wa.me/1234567890',
      linkedin: 'https://linkedin.com/in/azmi',
      youtube: 'https://youtube.com/@azmi',
      twitter: 'https://x.com/azmi',
      tiktok: 'https://tiktok.com/@azmi',
      instagram: 'https://instagram.com/azmi',
    };

    const { container } = render(
      <SocialGrid socialLinks={socialLinks} theme={defaultTheme} />,
    );

    const anchorElements = container.querySelectorAll('a');
    expect(anchorElements).toHaveLength(6);

    const hrefs = Array.from(anchorElements).map((el) => el.getAttribute('href'));
    expect(hrefs).toEqual([
      'https://instagram.com/azmi',
      'https://tiktok.com/@azmi',
      'https://x.com/azmi',
      'https://youtube.com/@azmi',
      'https://linkedin.com/in/azmi',
      'https://wa.me/1234567890',
    ]);
  });

  it('renders instagram before linkedin when only those two are present', () => {
    const socialLinks = {
      linkedin: 'https://www.linkedin.com/in/azmi-amirullah/',
      instagram: 'https://instagram.com/azmi_amirullah',
    };

    const { container } = render(
      <SocialGrid socialLinks={socialLinks} theme={defaultTheme} />,
    );

    const anchorElements = container.querySelectorAll('a');
    expect(anchorElements).toHaveLength(2);

    const hrefs = Array.from(anchorElements).map((el) => el.getAttribute('href'));
    expect(hrefs[0]).toBe('https://instagram.com/azmi_amirullah');
    expect(hrefs[1]).toBe('https://www.linkedin.com/in/azmi-amirullah/');
  });

  it('ignores empty links', () => {
    const socialLinks = {
      instagram: 'https://instagram.com/azmi',
      twitter: '',
      linkedin: 'https://linkedin.com/in/azmi',
    };

    const { container } = render(
      <SocialGrid socialLinks={socialLinks} theme={defaultTheme} />,
    );

    const anchorElements = container.querySelectorAll('a');
    expect(anchorElements).toHaveLength(2);

    const hrefs = Array.from(anchorElements).map((el) => el.getAttribute('href'));
    expect(hrefs).toEqual([
      'https://instagram.com/azmi',
      'https://linkedin.com/in/azmi',
    ]);
  });
});
