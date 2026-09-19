import { describe, it, expect } from 'vitest';
import { getEmbedInfo, isAudioUrl } from '@/features/bio/embed';

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

describe('isAudioUrl', () => {
  it('returns false for null, empty, or non-audio URLs', () => {
    expect(isAudioUrl('')).toBe(false);
    expect(isAudioUrl(null)).toBe(false);
    expect(isAudioUrl(undefined)).toBe(false);
    expect(isAudioUrl('https://example.com')).toBe(false);
    expect(isAudioUrl('https://example.com/song')).toBe(false);
    expect(isAudioUrl('https://example.com/song.html')).toBe(false);
  });

  it('returns true for common direct audio file extensions', () => {
    expect(isAudioUrl('https://example.com/audio.mp3')).toBe(true);
    expect(isAudioUrl('https://example.com/audio.m4a')).toBe(true);
    expect(isAudioUrl('https://example.com/audio.ogg')).toBe(true);
    expect(isAudioUrl('https://example.com/audio.wav')).toBe(true);
    expect(isAudioUrl('https://example.com/audio.aac')).toBe(true);
    expect(isAudioUrl('https://example.com/audio.flac')).toBe(true);
    expect(isAudioUrl('https://example.com/audio.opus')).toBe(true);
  });

  it('is case-insensitive and handles query parameters and hash fragments', () => {
    expect(isAudioUrl('https://cdn.example.com/stream.MP3?token=abc123xyz')).toBe(true);
    expect(isAudioUrl('https://cdn.example.com/podcast.M4A#t=120')).toBe(true);
    expect(isAudioUrl('https://cdn.example.com/audio.wav?download=true#start')).toBe(true);
  });
});

