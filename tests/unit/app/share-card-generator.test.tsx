/** @vitest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ShareCardGenerator from '@/app/(platform)/bio/analytics/components/ShareCardGenerator';
import type { AnalyticsData } from '@/types/analytics';

const data: AnalyticsData = {
  chartData: [],
  totalClicks: 12,
  totalViews: 20,
  ctr: 60,
  topLinks: [
    {
      id: 'link-1',
      title: 'Portfolio',
      url: 'https://example.com',
      clicks: 12,
    },
  ],
  topReferer: null,
  userLinks: [{ id: 'link-1', title: 'Portfolio' }],
  countries: [{ country: 'US', click_count: 12, view_count: 20 }],
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ShareCardGenerator', () => {
  it('draws the canvas when the preview dialog is opened for the first time', () => {
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockImplementation(() => null);

    render(
      <ShareCardGenerator
        data={data}
        username='creator'
        themeName='default'
        customTheme={null}
        dateRange='24h'
      />,
    );

    expect(getContext).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Share Stats' }));

    expect(getContext).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole('button', { name: 'Copy to Clipboard' }),
    ).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Download PNG' }),
    ).not.toBeNull();
  });
});
