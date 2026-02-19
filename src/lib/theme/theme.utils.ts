import { THEMES, DEFAULT_THEME_ID } from './theme.config';
import type {
  ThemeConfig,
  ThemeId,
  ButtonStyle,
  ButtonShape,
} from './theme.types';

/**
 * Get theme configuration by ID with fallback to default
 */
export function getTheme(themeId: string | null | undefined): ThemeConfig {
  const id = (themeId || DEFAULT_THEME_ID) as ThemeId;
  return THEMES[id] || THEMES[DEFAULT_THEME_ID];
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

export interface ButtonClassOptions {
  /** 'preview' for dashboard preview, 'full' for public profile with animations */
  variant?: 'preview' | 'full';
}

/**
 * Get button classes based on theme, style, shape, and variant
 */
export function getButtonClasses(
  theme: ThemeConfig,
  buttonStyle: ButtonStyle = 'default',
  buttonShape: ButtonShape = 'rounded',
  options: ButtonClassOptions = {},
): string {
  const { colors } = theme;
  const { variant = 'preview' } = options;
  const shapeClass =
    buttonShape === 'square'
      ? 'rounded-none'
      : buttonShape === 'pill'
        ? 'rounded-full'
        : buttonShape === 'leaf'
          ? 'rounded-tr-2xl rounded-bl-2xl'
          : 'rounded-xl';

  // Base classes for full variant (public profile pages)
  const fullBaseClasses =
    variant === 'full'
      ? 'block w-full p-4 md:p-5 text-center text-lg font-medium transition-all duration-200 ease-in-out hover:-translate-y-0.5 backdrop-blur-sm'
      : '';

  // Preview variant classes (dashboard phone preview)
  const previewBaseClasses =
    variant === 'preview' ? 'shadow-sm backdrop-blur-sm' : '';

  if (buttonStyle === 'transparent') {
    return `${fullBaseClasses} ${shapeClass} bg-transparent border-2 ${colors.outlineBorder} ${colors.outlineText} ${colors.outlineHoverBg}`.trim();
  }

  return `${fullBaseClasses} ${previewBaseClasses} ${shapeClass} ${colors.buttonBg} border ${colors.buttonBorder} ${colors.buttonText} ${colors.buttonHoverBg} ${colors.buttonHoverBorder}`.trim();
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
