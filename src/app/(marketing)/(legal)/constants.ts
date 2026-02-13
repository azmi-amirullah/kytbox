export const LEGAL_LAST_UPDATED = 'February 13, 2026';

export const SUPPORT_EMAIL = 'support@kytbox.com';

export const LEGAL_ENTITY = 'Mohd. Azmi Amirullah. A';

/** Generates a URL-friendly slug from a section title for deep-linking */
export function toSectionId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
}
