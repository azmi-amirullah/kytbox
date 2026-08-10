/**
 * Utility functions for resolving link icons and Google favicons.
 */

export function extractDomain(url: string): string | null {
  if (!url) return null;
  try {
    const formattedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const parsed = new URL(formattedUrl);
    const hostname = parsed.hostname.replace(/^www\./i, '');
    return hostname || null;
  } catch {
    return null;
  }
}

export function getFaviconUrl(url: string): string | null {
  const domain = extractDomain(url);
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

export function resolveLinkIcon(
  url: string,
  iconUrl?: string | null,
): { url: string | null; isFavicon: boolean } {
  if (iconUrl && iconUrl.trim().length > 0) {
    return { url: iconUrl.trim(), isFavicon: false };
  }

  const faviconUrl = getFaviconUrl(url);
  if (faviconUrl) {
    return { url: faviconUrl, isFavicon: true };
  }

  return { url: null, isFavicon: false };
}
