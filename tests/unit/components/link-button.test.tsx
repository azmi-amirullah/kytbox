/** @vitest-environment jsdom */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LinkButton } from '@/features/bio/components/LinkButton';

describe('LinkButton', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders initial href matching SSR without referrer query', () => {
    render(
      <LinkButton
        href='/azmi/my-link'
        title='My Link'
        url='https://example.com'
      />,
    );

    const anchor = screen.getByRole('link');
    expect(anchor.getAttribute('href')).toBe('/azmi/my-link');
  });

  it('does not append ?ref when referrer is internal (e.g., localhost vs app.localhost)', () => {
    Object.defineProperty(document, 'referrer', {
      value: 'http://localhost:3000/app',
      configurable: true,
    });
    Object.defineProperty(window, 'location', {
      value: { hostname: 'app.localhost' },
      configurable: true,
    });

    render(
      <LinkButton
        href='/azmi/my-link'
        title='My Link'
        url='https://example.com'
      />,
    );

    const anchor = screen.getByRole('link');
    expect(anchor.getAttribute('href')).toBe('/azmi/my-link');
  });

  it('appends ?ref when referrer is external (e.g., twitter.com)', async () => {
    Object.defineProperty(document, 'referrer', {
      value: 'https://twitter.com/azmi',
      configurable: true,
    });
    Object.defineProperty(window, 'location', {
      value: { hostname: 'kytbox.com' },
      configurable: true,
    });

    render(
      <LinkButton
        href='/azmi/my-link'
        title='My Link'
        url='https://example.com'
      />,
    );

    const anchor = screen.getByRole('link');
    expect(anchor.getAttribute('href')).toBe(
      '/azmi/my-link?ref=twitter.com',
    );
  });
});
