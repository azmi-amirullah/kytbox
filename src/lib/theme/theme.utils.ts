import { THEMES, DEFAULT_THEME_ID } from './theme.config';
import type {
  ThemeConfig,
  ThemeId,
  ButtonStyle,
  ButtonShape,
  ThemeColors,
  CustomThemeData,
} from './theme.types';

/**
 * Get theme configuration by ID with fallback to default
 * If 'custom', it will synthesize a ThemeConfig from the provided customTheme JSON.
 */
export function getTheme(
  themeId: string | null | undefined,
  customTheme?: CustomThemeData | null,
): ThemeConfig {
  const id = (themeId || DEFAULT_THEME_ID) as ThemeId;

  if (id === 'custom' && customTheme) {
    // Generate valid tailwind arbitrary classes for arbitrary hex values
    // customTheme should at least have strings for each key
    const colors: ThemeColors = {
      background: 'bg-[var(--custom-bg,#ffffff)]',
      textPrimary: 'text-[var(--custom-text-primary,#000000)]',
      textSecondary: 'text-[var(--custom-text-secondary,#666666)]',
      elementBg: 'bg-[var(--custom-element-bg,#0000001a)]',
      elementBorder: 'border-[var(--custom-element-border,#00000033)]',
      elementRing: 'ring-[var(--custom-element-ring,#00000033)]',
      buttonBg: 'bg-[var(--custom-button-bg,#000000)]',
      buttonBorder: 'border-[var(--custom-button-border,#000000)]',
      buttonText: 'text-[var(--custom-button-text,#ffffff)]',
      buttonHoverBg: 'hover:opacity-80',
      buttonHoverBorder: 'hover:border-[var(--custom-button-border,#000000)]',
      outlineBorder: 'border-[var(--custom-button-bg,#000000)]',
      outlineText: 'text-[var(--custom-button-bg,#000000)]',
      outlineHoverBg: 'hover:opacity-80',
      footerBg: 'bg-[var(--custom-footer-bg,#0000001a)]',
      footerBorder: 'border-[var(--custom-footer-border,#00000033)]',
      footerText: 'text-[var(--custom-footer-text,#666666)]',
      footerBrandText: 'text-[var(--custom-text-primary,#000000)]',
    };

    return {
      id: 'custom',
      name: 'Custom',
      category: 'custom',
      previewClass: colors.background + ' ' + colors.textPrimary,
      colors,
    };
  }

  return THEMES[id as Exclude<ThemeId, 'custom'>] || THEMES[DEFAULT_THEME_ID];
}

/**
 * Get container classes for the theme (background + text)
 */
export function getContainerClasses(theme: ThemeConfig): string {
  return `${theme.colors.background} ${theme.colors.textPrimary}`;
}

/**
 * Validate and normalize button style from database value
 */
export function validateButtonStyle(
  value: string | null | undefined,
): ButtonStyle {
  if (value === 'outline' || value === 'transparent') return 'transparent';
  return 'default';
}

/**
 * Validate and normalize button shape from database value
 */
export function validateButtonShape(
  value: string | null | undefined,
): ButtonShape {
  if (value === 'square') return 'square';
  if (value === 'pill') return 'pill';
  if (value === 'leaf') return 'leaf';
  return 'rounded';
}

/**
 * Get button classes based on theme, style, and shape
 */
export function getButtonClasses(
  theme: ThemeConfig,
  buttonStyle: ButtonStyle = 'default',
  buttonShape: ButtonShape = 'rounded',
): string {
  const { colors } = theme;
  const shapeClass =
    buttonShape === 'square'
      ? 'rounded-none'
      : buttonShape === 'pill'
        ? 'rounded-full'
        : buttonShape === 'leaf'
          ? 'rounded-tr-2xl rounded-bl-2xl'
          : 'rounded-xl';

  // Base classes for the unified profile buttons (mobile-standard)
  const baseClasses =
    'block w-full p-4 text-center text-lg font-medium transition-all duration-200 ease-in-out hover:-translate-y-0.5 backdrop-blur-sm shadow-sm';

  if (buttonStyle === 'transparent') {
    return `${baseClasses} bg-transparent border-2 border-primary/20 hover:border-primary/40 text-primary ${shapeClass}`;
  }

  return `${baseClasses} ${shapeClass} ${colors.buttonBg} border ${colors.buttonBorder} ${colors.buttonText} ${colors.buttonHoverBg} ${colors.buttonHoverBorder}`.trim();
}

/**
 * Get classes for avatar/profile image container
 */
export function getAvatarClasses(theme: ThemeConfig): string {
  const { colors } = theme;
  return `${colors.elementBg} ${colors.textPrimary} ${colors.elementRing}`;
}

/**
 * Get classes for empty state containers
 */
export function getEmptyStateClasses(theme: ThemeConfig): string {
  const { colors } = theme;
  return `${colors.elementBg} ${colors.elementBorder}`;
}

/**
 * Get classes for footer/branding
 */
export function getFooterClasses(theme: ThemeConfig): string {
  const { colors } = theme;
  return `${colors.footerBg} ${colors.footerBorder} ${colors.footerText}`;
}

/**
 * Get shape class from button shape setting
 */
export function getShapeClass(buttonShape: ButtonShape = 'rounded'): string {
  if (buttonShape === 'square') return 'rounded-none';
  if (buttonShape === 'pill') return 'rounded-full';
  if (buttonShape === 'leaf') return 'rounded-tr-2xl rounded-bl-2xl';
  return 'rounded-xl';
}

/**
 * Normalizes a hex string by padding with zeros if it's incomplete.
 * This ensures CSS variables always receive a valid hex format.
 */
export function normalizeHex(hex: string): string {
  if (!hex || typeof hex !== 'string') return '#000000';

  const hasHash = hex.startsWith('#');
  const raw = hasHash ? hex.slice(1) : hex;

  // If the string contains any non-hex characters, it's invalid.
  // We return black to match the browser's native color picker behavior.
  if (/[^0-9A-Fa-f]/.test(raw)) {
    return '#000000';
  }

  const len = raw.length;
  if (len === 0) return '#000000';

  // Align with editor's padEnd logic for live preview consistency
  if (len <= 6) {
    return `#${raw.padEnd(6, '0')}`;
  }

  if (len <= 8) {
    return `#${raw.padEnd(8, '0')}`;
  }

  return `#${raw.slice(0, 8)}`;
}
