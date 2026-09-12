export interface SanitizedInvoiceUrl {
  isValid: boolean
  isDrive: boolean
  isDropbox: boolean
  isDirectImage: boolean
  thumbnailUrl: string | null
  viewUrl: string | null
}

const DRIVE_FILE_ID_REGEX = /\/file\/d\/([a-zA-Z0-9_-]+)/
const DRIVE_QUERY_ID_REGEX = /[?&]id=([a-zA-Z0-9_-]+)/
const IMAGE_EXTENSION_REGEX = /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i

/**
 * Sanitizes and extracts direct thumbnail streams from external cloud receipts
 * (Google Drive, Dropbox, direct image links).
 * Enforces strict http/https protocols to prevent XSS.
 */
export function sanitizeInvoiceUrl(rawUrl: string | null | undefined): SanitizedInvoiceUrl {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return {
      isValid: false,
      isDrive: false,
      isDropbox: false,
      isDirectImage: false,
      thumbnailUrl: null,
      viewUrl: null,
    }
  }

  const trimmed = rawUrl.trim()
  if (!trimmed) {
    return {
      isValid: false,
      isDrive: false,
      isDropbox: false,
      isDirectImage: false,
      thumbnailUrl: null,
      viewUrl: null,
    }
  }

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        isValid: false,
        isDrive: false,
        isDropbox: false,
        isDirectImage: false,
        thumbnailUrl: null,
        viewUrl: null,
      }
    }

    const hostname = parsed.hostname.toLowerCase()

    // 1. Google Drive view URL transformer
    if (hostname.includes('drive.google.com')) {
      let fileId: string | null = null
      const pathMatch = parsed.pathname.match(DRIVE_FILE_ID_REGEX)
      if (pathMatch && pathMatch[1]) {
        fileId = pathMatch[1]
      } else {
        const queryMatch = parsed.search.match(DRIVE_QUERY_ID_REGEX)
        if (queryMatch && queryMatch[1]) {
          fileId = queryMatch[1]
        }
      }

      if (fileId) {
        return {
          isValid: true,
          isDrive: true,
          isDropbox: false,
          isDirectImage: false,
          thumbnailUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`,
          viewUrl: parsed.toString(),
        }
      }
    }

    // 2. Dropbox share link transformer
    if (hostname.includes('dropbox.com')) {
      parsed.searchParams.set('raw', '1')
      parsed.searchParams.delete('dl')
      return {
        isValid: true,
        isDrive: false,
        isDropbox: true,
        isDirectImage: false,
        thumbnailUrl: parsed.toString(),
        viewUrl: trimmed,
      }
    }

    // 3. Direct Image Link
    if (IMAGE_EXTENSION_REGEX.test(parsed.pathname)) {
      return {
        isValid: true,
        isDrive: false,
        isDropbox: false,
        isDirectImage: true,
        thumbnailUrl: parsed.toString(),
        viewUrl: parsed.toString(),
      }
    }

    // 4. Other valid web URLs
    return {
      isValid: true,
      isDrive: false,
      isDropbox: false,
      isDirectImage: false,
      thumbnailUrl: null,
      viewUrl: parsed.toString(),
    }
  } catch {
    return {
      isValid: false,
      isDrive: false,
      isDropbox: false,
      isDirectImage: false,
      thumbnailUrl: null,
      viewUrl: null,
    }
  }
}
