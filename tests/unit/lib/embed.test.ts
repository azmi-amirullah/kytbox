import { describe, it, expect } from 'vitest';
import { getEmbedInfo } from '@/features/bio/embed';

describe('getEmbedInfo', () => {
  it('returns null for empty or non-embeddable URLs', () => {
    expect(getEmbedInfo('')).toBeNull();
    expect(getEmbedInfo(null)).toBeNull();
    expect(getEmbedInfo('https://example.com')).toBeNull();
    expect(getEmbedInfo('https://github.com/kytbox')).toBeNull();
  });

  it('correctly detects YouTube watch and short URLs', () => {
    const watch = getEmbedInfo('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(watch).toEqual({
      type: 'youtube',
      embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    });

    const shortUrl = getEmbedInfo('https://youtu.be/dQw4w9WgXcQ');
    expect(shortUrl).toEqual({
      type: 'youtube',
      embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    });
  });

  it('correctly detects Spotify track, album, and playlist URLs', () => {
    const track = getEmbedInfo('https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT');
    expect(track).toEqual({
      type: 'spotify',
      embedUrl: 'https://open.spotify.com/embed/track/4cOdK2wGLETKBW3PvgPWqT',
    });

    const album = getEmbedInfo('https://open.spotify.com/album/1DFamJ4nL1p8N6fR1Z');
    expect(album).toEqual({
      type: 'spotify',
      embedUrl: 'https://open.spotify.com/embed/album/1DFamJ4nL1p8N6fR1Z',
    });

    const playlist = getEmbedInfo('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M');
    expect(playlist).toEqual({
      type: 'spotify',
      embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M',
    });
  });
});
