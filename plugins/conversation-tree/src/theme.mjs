export const THEME_STORAGE_KEY = 'conversation-tree-theme-v1';
export const THEME_PREFERENCES = Object.freeze(['auto', 'light', 'dark']);

export function normalizeThemePreference(value) {
  return THEME_PREFERENCES.includes(value) ? value : 'auto';
}

export function resolveTheme({ preference = 'auto', hostTheme, systemDark = false } = {}) {
  const normalized = normalizeThemePreference(preference);
  if (normalized !== 'auto') return normalized;
  if (hostTheme === 'light' || hostTheme === 'dark') return hostTheme;
  return systemDark ? 'dark' : 'light';
}

export function themeSource({ preference = 'auto', hostTheme } = {}) {
  const normalized = normalizeThemePreference(preference);
  if (normalized !== 'auto') return 'manual';
  return hostTheme === 'light' || hostTheme === 'dark' ? 'host' : 'system';
}
