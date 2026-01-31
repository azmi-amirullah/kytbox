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
 * Get button classes based on theme, style, and shape
 */
export function getButtonClasses(
  theme: ThemeConfig,
  buttonStyle: ButtonStyle = 'default',
  buttonShape: ButtonShape = 'rounded',
): string {
  const { colors } = theme;
  const shapeClass = buttonShape === 'square' ? 'rounded-none' : 'rounded-xl';

  if (buttonStyle === 'outline') {
    return `${shapeClass} bg-transparent border-2 ${colors.outlineBorder} ${colors.outlineText} ${colors.outlineHoverBg}`;
  }

  return `${shapeClass} ${colors.buttonBg} border ${colors.buttonBorder} ${colors.buttonText} ${colors.buttonHoverBg} ${colors.buttonHoverBorder}`;
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
  return buttonShape === 'square' ? 'rounded-none' : 'rounded-xl';
}
