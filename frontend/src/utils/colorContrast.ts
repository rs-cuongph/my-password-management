/**
 * Color contrast utilities for WCAG compliance
 */

/**
 * Convert hex color to RGB
 */
export function hexToRgb(
  hex: string
): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate relative luminance
 * https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * https://www.w3.org/TR/WCAG20/#contrast-ratiodef
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    throw new Error('Invalid color format');
  }

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standards
 */
export function meetsWCAGAA(
  foreground: string,
  background: string,
  fontSize: 'normal' | 'large' = 'normal'
): boolean {
  const contrastRatio = getContrastRatio(foreground, background);

  // WCAG AA requires:
  // - 4.5:1 for normal text (under 18pt regular or 14pt bold)
  // - 3:1 for large text (18pt+ regular or 14pt+ bold)
  const requiredRatio = fontSize === 'large' ? 3 : 4.5;

  return contrastRatio >= requiredRatio;
}

/**
 * Check if contrast ratio meets WCAG AAA standards
 */
export function meetsWCAGAAA(
  foreground: string,
  background: string,
  fontSize: 'normal' | 'large' = 'normal'
): boolean {
  const contrastRatio = getContrastRatio(foreground, background);

  // WCAG AAA requires:
  // - 7:1 for normal text
  // - 4.5:1 for large text
  const requiredRatio = fontSize === 'large' ? 4.5 : 7;

  return contrastRatio >= requiredRatio;
}

/**
 * Get accessibility level for a color combination
 */
export function getAccessibilityLevel(
  foreground: string,
  background: string,
  fontSize: 'normal' | 'large' = 'normal'
): 'AAA' | 'AA' | 'FAIL' {
  if (meetsWCAGAAA(foreground, background, fontSize)) {
    return 'AAA';
  }
  if (meetsWCAGAA(foreground, background, fontSize)) {
    return 'AA';
  }
  return 'FAIL';
}

/**
 * Color palette with WCAG AA compliant combinations
 */
export const accessibleColors = {
  // Light theme colors (WCAG AA compliant)
  light: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb', // 4.5:1 against white
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252', // 4.5:1 against white
      700: '#404040', // 7:1 against white (AAA)
      800: '#262626',
      900: '#171717',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626', // 4.5:1 against white
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
  },
  // Dark theme colors (WCAG AA compliant)
  dark: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa', // 4.5:1 against dark
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    neutral: {
      50: '#fafafa', // 4.5:1 against dark
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },
  },
};

/**
 * Validate all colors in a palette
 */
export function validateColorPalette(
  palette: Record<string, string>,
  background: string
): Array<{
  name: string;
  color: string;
  contrastRatio: number;
  level: 'AAA' | 'AA' | 'FAIL';
}> {
  return Object.entries(palette).map(([name, color]) => ({
    name,
    color,
    contrastRatio: getContrastRatio(color, background),
    level: getAccessibilityLevel(color, background),
  }));
}

/**
 * Find the closest accessible color
 */
export function findAccessibleColor(
  targetColor: string,
  background: string,
  colors: string[],
  level: 'AA' | 'AAA' = 'AA'
): string | null {
  const targetRgb = hexToRgb(targetColor);
  if (!targetRgb) return null;

  const validator = level === 'AAA' ? meetsWCAGAAA : meetsWCAGAA;

  // Find compliant colors
  const compliantColors = colors.filter((color) =>
    validator(color, background)
  );

  if (compliantColors.length === 0) return null;

  // Find the closest color by calculating color distance
  let closestColor = compliantColors[0];
  let minDistance = Infinity;

  for (const color of compliantColors) {
    const rgb = hexToRgb(color);
    if (!rgb) continue;

    // Calculate Euclidean distance in RGB space
    const distance = Math.sqrt(
      Math.pow(targetRgb.r - rgb.r, 2) +
        Math.pow(targetRgb.g - rgb.g, 2) +
        Math.pow(targetRgb.b - rgb.b, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestColor = color;
    }
  }

  return closestColor;
}
