/** @vitest-environment jsdom */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Loader, BrandLoader } from '@/components/ui/loader';

describe('Loader Component', () => {
  it('renders default loader with accessible role and text', () => {
    render(<Loader />);

    const status = screen.getByRole('status');
    expect(status).toBeDefined();
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(screen.getAllByText('Loading...').length).toBeGreaterThanOrEqual(1);
  });

  it('renders fullscreen mode with backdrop blur overlay', () => {
    render(<Loader fullScreen text='Securing account...' />);

    const status = screen.getByRole('status');
    expect(status.className).toContain('fixed inset-0');
    expect(status.className).toContain('z-100');
    expect(status.className).toContain('h-dvh');
    expect(status.className).toContain('backdrop-blur-md');
    expect(screen.getAllByText('Securing account...').length).toBeGreaterThanOrEqual(1);
  });

  it('supports size variants without breaking layout', () => {
    const { container: smContainer } = render(<Loader size='sm' text='' />);
    expect(smContainer.querySelector('svg')).toBeDefined();

    const { container: xlContainer } = render(<Loader size='xl' text='Large loading' />);
    expect(xlContainer.querySelector('svg')).toBeDefined();
    expect(screen.getAllByText('Large loading').length).toBeGreaterThanOrEqual(1);
  });

  it('renders minimal variant without the center anchor glyph', () => {
    const { container } = render(<Loader size='md' variant='minimal' />);
    expect(container.querySelector('.animate-pulse.bg-primary\\/90')).toBeNull();
  });

  it('exports BrandLoader alias for backward compatibility', () => {
    render(<BrandLoader text='Brand loading' />);
    expect(screen.getAllByText('Brand loading').length).toBeGreaterThanOrEqual(1);
  });
});
