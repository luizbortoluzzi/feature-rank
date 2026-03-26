import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'indigo',
  primaryShade: { light: 6, dark: 4 },

  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontFamilyMonospace: '"JetBrains Mono", "Fira Code", monospace',

  headings: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontWeight: '600',
    sizes: {
      h1: { fontSize: '1.875rem', lineHeight: '1.3' },
      h2: { fontSize: '1.5rem', lineHeight: '1.35' },
      h3: { fontSize: '1.25rem', lineHeight: '1.4' },
      h4: { fontSize: '1.125rem', lineHeight: '1.45' },
      h5: { fontSize: '1rem', lineHeight: '1.5' },
      h6: { fontSize: '0.875rem', lineHeight: '1.5' },
    },
  },

  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '0.9375rem',
    lg: '1rem',
    xl: '1.125rem',
  },

  lineHeights: {
    xs: '1.4',
    sm: '1.45',
    md: '1.55',
    lg: '1.6',
    xl: '1.65',
  },

  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },

  radius: {
    xs: '4px',
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },

  defaultRadius: 'md',

  shadows: {
    xs: '0 1px 2px rgba(0,0,0,0.04)',
    sm: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    md: '0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.04)',
    lg: '0 10px 15px rgba(0,0,0,0.06), 0 4px 6px rgba(0,0,0,0.04)',
    xl: '0 20px 25px rgba(0,0,0,0.06), 0 10px 10px rgba(0,0,0,0.03)',
  },

  components: {
    Button: {
      defaultProps: { radius: 'md' },
      styles: { root: { fontWeight: '500' } },
    },
    Badge: {
      defaultProps: { radius: 'sm', variant: 'light' },
      styles: { root: { textTransform: 'none', fontWeight: '500' } },
    },
    Paper: {
      defaultProps: { shadow: 'xs', radius: 'md', withBorder: true },
    },
    Notification: {
      styles: { root: { boxShadow: '0 4px 6px rgba(0,0,0,0.05)' } },
    },
  },

  other: {
    sidebarWidth: 220,
    headerHeight: 60,
  },
});
