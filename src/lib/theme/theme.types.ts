/**
 * Theme System Types
 *
 * All colors use explicit Tailwind classes (e.g., 'text-neutral-900')
 * instead of CSS variables (e.g., 'text-foreground') to ensure
 * public profiles render consistently regardless of visitor's system theme.
 */

export interface ThemeColors {
  // Background (solid or gradient)
  background: string;

  // Text colors
  textPrimary: string;
  textSecondary: string;

  // Element colors (avatar placeholder, empty states, rings)
  elementBg: string;
  elementBorder: string;
  elementRing: string;

  // Button default style
  buttonBg: string;
  buttonBorder: string;
  buttonText: string;
  buttonHoverBg: string;
  buttonHoverBorder: string;

  // Button outline style
  outlineBorder: string;
  outlineText: string;
  outlineHoverBg: string;

  // Footer/branding
  footerBg: string;
  footerBorder: string;
  footerText: string;
  footerBrandText: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  previewClass: string; // Class for appearance editor theme card
  colors: ThemeColors;
}

export type ThemeId =
  | 'default'
  | 'dark'
  | 'gradient'
  | 'peach'
  | 'deepsea'
  | 'emerald'
  | 'lavender'
  | 'latte'
  | 'midnight'
  | 'sunset'
  | 'rosegold'
  | 'ocean'
  | 'charcoal';

export type ButtonStyle = 'default' | 'outline';
export type ButtonShape = 'rounded' | 'square' | 'pill' | 'leaf';
