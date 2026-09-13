/**
 * Cloud Attachment Resource Metadata Resolver & SSRF Defense
 * Zero storage footprint: tracks external resource bookmarks with rich metadata.
 */

export interface ResourceMetadata {
  url: string;
  title: string;
  domain: string;
  icon_url: string | null;
}

// Known cloud provider icons & brand presets
const KNOWN_SERVICES: Record<
  string,
  { name: string; iconUrl: string }
> = {
  'github.com': {
    name: 'GitHub',
    iconUrl: 'https://github.githubassets.com/favicons/favicon.svg',
  },
  'figma.com': {
    name: 'Figma',
    iconUrl: 'https://static.figma.com/app/icon/1/favicon.svg',
  },
  'drive.google.com': {
    name: 'Google Drive',
    iconUrl: 'https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png',
  },
  'docs.google.com': {
    name: 'Google Docs',
    iconUrl: 'https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico',
  },
  'loom.com': {
    name: 'Loom',
    iconUrl: 'https://cdn.loom.com/assets/favicons-loom/favicon-32x32.png',
  },
  'notion.so': {
    name: 'Notion',
    iconUrl: 'https://www.notion.so/front-static/favicon.ico',
  },
  'notion.site': {
    name: 'Notion',
    iconUrl: 'https://www.notion.so/front-static/favicon.ico',
  },
  'dropbox.com': {
    name: 'Dropbox',
    iconUrl: 'https://cfl.dropboxstatic.com/static/images/favicon-vflUeLeeY.ico',
  },
  'linear.app': {
    name: 'Linear',
    iconUrl: 'https://linear.app/static/favicon.ico',
  },
  'youtube.com': {
    name: 'YouTube',
    iconUrl: 'https://www.youtube.com/s/desktop/f2a74c43/img/favicon.ico',
  },
  'youtu.be': {
    name: 'YouTube',
    iconUrl: 'https://www.youtube.com/s/desktop/f2a74c43/img/favicon.ico',
  },
  'trello.com': {
    name: 'Trello',
    iconUrl: 'https://trello.com/favicon.ico',
  },
};

/**
 * Checks if a hostname or IP points to private, internal, or loopback networks (SSRF defense).
 */
export function isPrivateOrBlockedHost(hostname: string): boolean {
  const clean = hostname.trim().toLowerCase().replace(/^\[|\]$/g, '');

  if (
    clean === 'localhost' ||
    clean.endsWith('.localhost') ||
    clean.endsWith('.local') ||
    clean.endsWith('.internal')
  ) {
    return true;
  }

  // IPv6 checks
  if (
    clean === '::1' ||
    clean === '0:0:0:0:0:0:0:1' ||
    clean.startsWith('fe80:') || // link-local
    clean.startsWith('fc00:') || // unique local
    clean.startsWith('fd00:')
  ) {
    return true;
  }

  // Decimal, hex, or octal encoded IP address checks (e.g. 2130706433 or 0x7f000001)
  if (/^\d+$/.test(clean) || /^0x[0-9a-f]+$/i.test(clean) || /^0[0-7]+$/.test(clean)) {
    return true;
  }

  // IPv4 regex pattern
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = clean.match(ipv4Regex);
  if (!match) {
    // If not raw IPv4, check if it contains suspicious internal names
    return false;
  }

  const [, octet1Str, octet2Str, octet3Str, octet4Str] = match;
  const o1 = Number.parseInt(octet1Str, 10);
  const o2 = Number.parseInt(octet2Str, 10);
  const o3 = Number.parseInt(octet3Str, 10);
  const o4 = Number.parseInt(octet4Str, 10);

  if (o1 > 255 || o2 > 255 || o3 > 255 || o4 > 255) {
    return true;
  }

  // Loopback (127.0.0.0/8)
  if (o1 === 127) return true;

  // Zero network (0.0.0.0/8)
  if (o1 === 0) return true;

  // Private range 10.0.0.0/8
  if (o1 === 10) return true;

  // Private range 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
  if (o1 === 172 && o2 >= 16 && o2 <= 31) return true;

  // Private range 192.168.0.0/16
  if (o1 === 192 && o2 === 168) return true;

  // Carrier-grade NAT (100.64.0.0/10)
  if (o1 === 100 && o2 >= 64 && o2 <= 127) return true;

  // Link-local / Cloud metadata (169.254.0.0/16, including 169.254.169.254)
  if (o1 === 169 && o2 === 254) return true;

  // Broadcast / Multicast
  if (o1 >= 224) return true;

  return false;
}

/**
 * Asynchronously verifies that a hostname does not resolve to private/loopback/cloud metadata IP via DNS lookup.
 */
export async function assertSafeRemoteHost(hostname: string): Promise<void> {
  if (isPrivateOrBlockedHost(hostname)) {
    throw new Error('Access to private or internal network addresses is blocked');
  }

  // Skip DNS lookup for known trusted service domains
  const clean = hostname.trim().toLowerCase().replace(/^www\./, '');
  for (const serviceDomain of Object.keys(KNOWN_SERVICES)) {
    if (clean === serviceDomain || clean.endsWith(`.${serviceDomain}`)) {
      return;
    }
  }

  try {
    const dns = await import('node:dns');
    const records = await dns.promises.lookup(hostname, { all: true });
    for (const record of records) {
      if (isPrivateOrBlockedHost(record.address)) {
        throw new Error('Access to private or internal network addresses is blocked');
      }
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('Access to private')) {
      throw err;
    }
    // If lookup fails or environment lacks DNS, let subsequent fetch handle network failure
  }
}

/**
 * Validates and normalizes URL for SSRF security.
 */
export function validateSafeUrl(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new Error('Invalid URL format');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only HTTP and HTTPS URLs are allowed');
  }

  if (isPrivateOrBlockedHost(parsed.hostname)) {
    throw new Error('Access to private or internal network addresses is blocked');
  }

  return parsed;
}

/**
 * Resolves title, domain, and icon for an external resource URL with SSRF defense.
 */
export async function resolveResourceMetadata(
  rawUrl: string,
): Promise<ResourceMetadata> {
  const url = validateSafeUrl(rawUrl);
  const hostname = url.hostname.toLowerCase();
  const domain = hostname.replace(/^www\./, '');

  // Check known cloud services for instant 0-latency resolution
  for (const [serviceDomain, meta] of Object.entries(KNOWN_SERVICES)) {
    if (domain === serviceDomain || domain.endsWith(`.${serviceDomain}`)) {
      // Determine default title based on path or service
      let title = meta.name;
      const pathname = url.pathname.trim().replace(/^\/+/g, '');
      if (pathname) {
        const segments = pathname.split('/');
        const lastSegment = decodeURIComponent(segments[segments.length - 1] || '');
        if (lastSegment && lastSegment.length > 2) {
          title = `${meta.name}: ${lastSegment.replace(/[-_]/g, ' ')}`;
        }
      }
      return {
        url: url.toString(),
        title,
        domain,
        icon_url: meta.iconUrl,
      };
    }
  }

  // Fallback icon via Google Favicon service
  const fallbackIconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  let resolvedTitle = domain;

  // Safely fetch HTML head with 3-second timeout and 100KB streaming limit
  try {
    await assertSafeRemoteHost(url.hostname);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(url.toString(), {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    // Verify final redirected URL for SSRF
    const finalUrl = new URL(response.url);
    if (isPrivateOrBlockedHost(finalUrl.hostname)) {
      throw new Error('Redirected to restricted IP block');
    }
    if (finalUrl.hostname !== url.hostname) {
      await assertSafeRemoteHost(finalUrl.hostname);
    }

    if (response.ok && response.body) {
      const reader = response.body.getReader();
      let receivedBytes = 0;
      let html = '';
      const decoder = new TextDecoder();

      // Read at most 100KB (102,400 bytes)
      while (receivedBytes < 102400) {
        const { done, value } = await reader.read();
        if (done || !value) break;
        receivedBytes += value.length;
        html += decoder.decode(value, { stream: true });
        if (html.includes('</head>') || html.includes('</title>')) break;
      }

      reader.cancel();

      // Extract title from <title> or <meta property="og:title">
      const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);

      const candidateTitle = ogTitleMatch?.[1] || titleMatch?.[1];
      if (candidateTitle) {
        resolvedTitle = candidateTitle
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .trim();
        if (resolvedTitle.length > 200) {
          resolvedTitle = `${resolvedTitle.slice(0, 197)}...`;
        }
      }
    }
  } catch {
    // If fetching fails, timeout, or blocked by CORS/SSRF, graceful fallback to domain
    resolvedTitle = domain;
  }

  return {
    url: url.toString(),
    title: resolvedTitle,
    domain,
    icon_url: fallbackIconUrl,
  };
}

export const isPrivateOrRestrictedHost = isPrivateOrBlockedHost;

export type KnownServiceType =
  | 'figma'
  | 'github'
  | 'drive'
  | 'loom'
  | 'notion'
  | 'dropbox'
  | 'linear'
  | 'youtube'
  | 'trello'
  | 'link';

export function detectServiceType(domain: string): KnownServiceType {
  const d = domain.toLowerCase().replace(/^www\./, '');
  if (d.includes('figma.com')) return 'figma';
  if (d.includes('github.com')) return 'github';
  if (d.includes('drive.google.com') || d.includes('docs.google.com')) return 'drive';
  if (d.includes('loom.com')) return 'loom';
  if (d.includes('notion.so') || d.includes('notion.site')) return 'notion';
  if (d.includes('dropbox.com')) return 'dropbox';
  if (d.includes('linear.app')) return 'linear';
  if (d.includes('youtube.com') || d.includes('youtu.be')) return 'youtube';
  if (d.includes('trello.com')) return 'trello';
  return 'link';
}

export async function detectResourceMetadata(rawUrl: string): Promise<{
  url: string;
  title: string;
  domain: string;
  icon_url: string | null;
  service: KnownServiceType;
}> {
  try {
    const url = new URL(rawUrl.trim());
    if (isPrivateOrBlockedHost(url.hostname)) {
      return {
        url: rawUrl,
        title: url.hostname,
        domain: url.hostname,
        icon_url: null,
        service: 'link',
      };
    }
    const base = await resolveResourceMetadata(rawUrl);
    const service = detectServiceType(base.domain);
    let title = base.title;

    if (service === 'figma' && (!title || title.startsWith('Figma') || title === 'figma.com')) {
      title = 'Figma Design';
    } else if (service === 'loom' && (!title || title.startsWith('Loom') || title === 'loom.com')) {
      title = 'Loom Video Recording';
    } else if (service === 'drive' && (url.hostname.includes('docs.google.com') || !title)) {
      title = 'Google Docs Document';
    } else if (service === 'notion' && (!title || title.startsWith('Notion') || title === 'notion.so')) {
      title = 'Notion Page';
    } else if (service === 'github') {
      const match = url.pathname.match(/^\/([^/]+\/[^/]+)/);
      if (match) {
        title = `GitHub: ${match[1]}`;
      }
    }

    return {
      ...base,
      title,
      service,
    };
  } catch {
    return {
      url: rawUrl,
      title: 'External Resource',
      domain: '',
      icon_url: null,
      service: 'link',
    };
  }
}
