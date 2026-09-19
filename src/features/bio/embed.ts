export interface EmbedInfo {
  type: 'youtube' | 'spotify';
  embedUrl: string;
}

/**
 * Detects YouTube or Spotify URLs and returns the corresponding embed URL and media type.
 */
export function getEmbedInfo(url: string | null | undefined): EmbedInfo | null {
  if (!url) return null;

  // YouTube: youtube.com/watch?v=X or youtu.be/X
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`,
    };
  }

  // Spotify: open.spotify.com/track/X or /album/X or /playlist/X
  const spMatch = url.match(
    /open\.spotify\.com\/(track|album|playlist)\/([\w]+)/,
  );
  if (spMatch && spMatch[1] && spMatch[2]) {
    return {
      type: 'spotify',
      embedUrl: `https://open.spotify.com/embed/${spMatch[1]}/${spMatch[2]}`,
    };
  }

  return null;
}

const AUDIO_EXTENSION_REGEX = /\.(mp3|m4a|ogg|wav|aac|flac|opus)(?:$|[?#])/i;

/**
 * Detects if a URL points directly to an audio file (.mp3, .m4a, .ogg, .wav, etc.)
 */
export function isAudioUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return AUDIO_EXTENSION_REGEX.test(parsed.pathname);
  } catch {
    return AUDIO_EXTENSION_REGEX.test(url);
  }
}
