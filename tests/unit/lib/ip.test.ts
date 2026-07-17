import { getIp } from '@/lib/ip';
import { vi, describe, it, expect } from 'vitest';
import { headers } from 'next/headers';

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

describe('getIp', () => {
  it('prioritizes x-vercel-forwarded-for', async () => {
    const mockHeaders = new Headers();
    mockHeaders.set('x-vercel-forwarded-for', '203.0.113.195, 70.41.3.18');
    mockHeaders.set('x-real-ip', '198.51.100.1');
    mockHeaders.set('x-forwarded-for', '192.0.2.1');

    vi.mocked(headers).mockResolvedValue(mockHeaders);

    const ip = await getIp();
    expect(ip).toBe('203.0.113.195');
  });

  it('falls back to x-real-ip', async () => {
    const mockHeaders = new Headers();
    mockHeaders.set('x-real-ip', '198.51.100.1');
    mockHeaders.set('x-forwarded-for', '192.0.2.1');

    vi.mocked(headers).mockResolvedValue(mockHeaders);

    const ip = await getIp();
    expect(ip).toBe('198.51.100.1');
  });

  it('falls back to x-forwarded-for', async () => {
    const mockHeaders = new Headers();
    mockHeaders.set('x-forwarded-for', '192.0.2.1, 10.0.0.1');

    vi.mocked(headers).mockResolvedValue(mockHeaders);

    const ip = await getIp();
    expect(ip).toBe('192.0.2.1');
  });

  it('falls back to localhost when no headers present', async () => {
    const mockHeaders = new Headers();

    vi.mocked(headers).mockResolvedValue(mockHeaders);

    const ip = await getIp();
    expect(ip).toBe('127.0.0.1');
  });
});
