import { createTheme, rem, type MantineTheme } from '@mantine/core'

export const theme = createTheme({
  primaryColor: 'indigo',
  primaryShade: { light: 6, dark: 5 },

  defaultGradient: {
    from: 'indigo.6',
    to: 'violet.5',
    deg: 135,
  },

  white: '#ffffff',
  black: '#111827',

  fontFamily: 'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontFamilyMonospace: '"JetBrains Mono", "Fira Code", monospace',
  headings: {
    fontFamily: 'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontWeight: '600',
    sizes: {
      h1: { fontSize: rem(38), lineHeight: '1.25' },
      h2: { fontSize: rem(32), lineHeight: '1.3' },
      h3: { fontSize: rem(26), lineHeight: '1.35' },
      h4: { fontSize: rem(22), lineHeight: '1.4' },
      h5: { fontSize: rem(19), lineHeight: '1.45' },
      h6: { fontSize: rem(17), lineHeight: '1.5' },
    },
  },

  fontSizes: {
    xs: rem(13),
    sm: rem(15),
    md: rem(17),
    lg: rem(19),
    xl: rem(22),
  },

  lineHeights: {
    xs: '1.45',
    sm: '1.5',
    md: '1.6',
    lg: '1.65',
    xl: '1.7',
  },

  spacing: {
    xs: rem(10),
    sm: rem(14),
    md: rem(18),
    lg: rem(24),
    xl: rem(32),
  },

  radius: {
    xs: rem(8),
    sm: rem(12),
    md: rem(16),
    lg: rem(20),
    xl: rem(28),
  },

  defaultRadius: 'lg',

  shadows: {
    xs: '0 2px 6px rgba(17, 24, 39, 0.04)',
    sm: '0 6px 14px rgba(17, 24, 39, 0.06)',
    md: '0 10px 24px rgba(17, 24, 39, 0.08)',
    lg: '0 16px 40px rgba(17, 24, 39, 0.10)',
    xl: '0 24px 60px rgba(17, 24, 39, 0.12)',
  },

  components: {
    Button: {
      defaultProps: {
        radius: 'xl',
      },
      styles: {
        root: {
          fontWeight: 600,
          transition: 'transform 120ms ease, box-shadow 120ms ease',
        },
      },
    },

    Input: {
      defaultProps: {
        radius: 'xl',
        size: 'md',
      },
    },

    TextInput: {
      defaultProps: {
        radius: 'xl',
        size: 'md',
      },
    },

    PasswordInput: {
      defaultProps: {
        radius: 'xl',
        size: 'md',
      },
    },

    NumberInput: {
      defaultProps: {
        radius: 'xl',
        size: 'md',
      },
    },

    Select: {
      defaultProps: {
        radius: 'xl',
        size: 'md',
      },
    },

    MultiSelect: {
      defaultProps: {
        radius: 'xl',
        size: 'md',
      },
    },

    NativeSelect: {
      defaultProps: {
        radius: 'xl',
        size: 'md',
      },
    },

    Textarea: {
      defaultProps: {
        radius: 'xl',
        size: 'md',
      },
    },

    Paper: {
      defaultProps: {
        shadow: 'sm',
        radius: 'xl',
        withBorder: true,
      },
    },
    Box: {
      defaultProps: {
        shadow: 'sm',
      },
    },
    Card: {
      defaultProps: {
        radius: 'xl',
        shadow: 'sm',
        withBorder: true,
        padding: 'lg',
      },
    },

    Table: {
      defaultProps: {
        highlightOnHover: true,
        withTableBorder: false,
        withColumnBorders: false,
        verticalSpacing: 'md',
        horizontalSpacing: 'lg',
      },
      styles: (theme: MantineTheme) => ({
        table: {
          borderCollapse: 'separate',
          borderSpacing: 0,
          overflow: 'hidden',
          borderRadius: theme.radius.xl,
          backgroundColor: theme.white,
        },
        thead: {
          backgroundColor: theme.colors.gray[0],
        },
        th: {
          fontWeight: 600,
          fontSize: theme.fontSizes.sm,
          padding: `${rem(14)} ${rem(18)}`,
          borderBottom: `1px solid ${theme.colors.gray[2]}`,
        },
        td: {
          fontSize: theme.fontSizes.sm,
          padding: `${rem(14)} ${rem(18)}`,
          borderBottom: `1px solid ${theme.colors.gray[1]}`,
        },
        tr: {
          transition: 'background-color 120ms ease',
        },
      }),
    },

    Badge: {
      defaultProps: {
        radius: 'xl',
        variant: 'light',
      },
      styles: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },

    Container: {
      defaultProps: {
        size: 'lg',
      },
    },

    Notification: {
      defaultProps: {
        radius: 'xl',
      },
      styles: {
        root: {
          boxShadow: '0 10px 24px rgba(17, 24, 39, 0.08)',
        },
      },
    },
  },
})
