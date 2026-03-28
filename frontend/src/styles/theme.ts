import { createTheme, rem, ScrollArea, type MantineTheme } from '@mantine/core'

const indigo = [
  '#EEF1FF',
  '#E0E7FF',
  '#C7D2FE',
  '#A5B4FC',
  '#818CF8',
  '#6366F1',
  '#4F46E5',
  '#4338CA',
  '#3730A3',
  '#312E81',
] as const

const violet = [
  '#F5F3FF',
  '#EDE9FE',
  '#DDD6FE',
  '#C4B5FD',
  '#A78BFA',
  '#8B5CF6',
  '#7C3AED',
  '#6D28D9',
  '#5B21B6',
  '#4C1D95',
] as const

const gray = [
  '#F8F9FD',
  '#F1F3FA',
  '#E6E9F2',
  '#D7DCEA',
  '#B8C0D4',
  '#8E97B0',
  '#66708A',
  '#4A536B',
  '#31384D',
  '#1E2435',
] as const

const green = [
  '#ECFDF3',
  '#D1FADF',
  '#A6F4C5',
  '#6CE9A6',
  '#32D583',
  '#12B76A',
  '#039855',
  '#027A48',
  '#05603A',
  '#054F31',
] as const

const yellow = [
  '#FFFAEB',
  '#FEF0C7',
  '#FEDF89',
  '#FEC84B',
  '#FDB022',
  '#F79009',
  '#DC6803',
  '#B54708',
  '#93370D',
  '#7A2E0E',
] as const

const red = [
  '#FEF3F2',
  '#FEE4E2',
  '#FECDCA',
  '#FDA29B',
  '#F97066',
  '#F04438',
  '#D92D20',
  '#B42318',
  '#912018',
  '#7A271A',
] as const

export const theme = createTheme({
  colors: {
    indigo,
    violet,
    gray,
    green,
    yellow,
    red,
  },

  primaryColor: 'indigo',
  primaryShade: { light: 6, dark: 5 },

  defaultGradient: {
    from: 'indigo.6',
    to: 'violet.5',
    deg: 135,
  },

  white: '#FFFFFF',
  black: '#1E2435',

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
    full: '9999px',
  },

  defaultRadius: 'lg',

  shadows: {
    xs: '0 2px 6px rgba(30, 36, 53, 0.04)',
    sm: '0 6px 14px rgba(30, 36, 53, 0.06)',
    md: '0 10px 24px rgba(30, 36, 53, 0.08)',
    lg: '0 16px 40px rgba(30, 36, 53, 0.10)',
    xl: '0 24px 60px rgba(30, 36, 53, 0.12)',
  },

  components: {
    Button: {
      defaultProps: {
        radius: 'xl',
      },
      styles: (theme: MantineTheme) => ({
        root: {
          height: rem(52),
          fontWeight: 600,
          borderRadius: theme.radius.xl,
          transition: 'transform 120ms ease, box-shadow 120ms ease',
        },
      }),
    },
    Modal: {
      defaultProps: {
        centered: true,
        size: 760,
        scrollAreaComponent: ScrollArea.Autosize,
        overlayProps: {
          backgroundOpacity: 0.55,
          blur: 4,
        },
        transitionProps: {
          transition: 'fade-down',
          duration: 180,
          timingFunction: 'ease',
        },
      },

      styles: (theme: MantineTheme) => ({
        content: {
          borderRadius: theme.radius.xl,
          border: `1px solid ${theme.colors.gray[2]}`,
          boxShadow: '0 24px 70px rgba(30, 36, 53, 0.18)',
          backgroundColor: theme.white,
          overflow: 'hidden',
        },

        header: {
          position: 'relative',
          padding: `${rem(24)} ${rem(24)} ${rem(14)}`,
          backgroundColor: theme.white,
          justifyContent: 'center',

          '&::after': {
            content: '""',
            position: 'absolute',
            left: rem(24),
            right: rem(24),
            bottom: 0,
            height: 1,
            backgroundColor: theme.colors.gray[1],
          },
        },

        title: {
          width: '100%',
          textAlign: 'center',
          fontSize: theme.fontSizes.xl,
          fontWeight: 700,
          color: theme.colors.gray[9],
          lineHeight: 1.2,
        },

        body: {
          paddingTop: rem(20),
          paddingRight: rem(12),
          paddingBottom: rem(24),
          paddingLeft: rem(24),
          backgroundColor: theme.white,
        },

        close: {
          borderRadius: theme.radius.full,
          color: theme.colors.gray[6],
          transition: 'background-color 120ms ease, color 120ms ease',

          '&:hover': {
            backgroundColor: theme.colors.gray[0],
            color: theme.colors.gray[8],
          },
        },

        inner: {
          padding: rem(20),
        },
      }),
    },

    ScrollArea: {
      defaultProps: {
        scrollbarSize: 8,
        type: 'always',
        offsetScrollbars: 'y',
      },
      styles: (theme: MantineTheme) => ({
        root: {
          maxHeight: 'calc(100vh - 120px)',
        },
        viewport: {
          paddingRight: rem(12),
        },
        scrollbar: {
          backgroundColor: theme.colors.gray[0],
          borderRadius: theme.radius.full,
          padding: rem(2),
        },
        thumb: {
          backgroundColor: theme.colors.gray[4],
          borderRadius: theme.radius.full,
          minHeight: rem(28),
        },
        corner: {
          backgroundColor: 'transparent',
        },
      }),
    },
    InputWrapper: {
      styles: (theme: MantineTheme) => ({
        label: {
          fontSize: theme.fontSizes.md,
          fontWeight: 700,
          color: theme.colors.gray[8],
          marginBottom: 6,
        },
        description: {
          fontSize: theme.fontSizes.sm,
          lineHeight: 1.45,
          color: theme.colors.gray[6],
          marginBottom: 10,
        },
        error: {
          fontSize: theme.fontSizes.xs,
          marginTop: 6,
        },
      }),
    },

    Input: {
      defaultProps: {
        size: 'md',
        radius: 'xl',
      },
      styles: (theme: MantineTheme) => ({
        input: {
          height: rem(52),
          borderRadius: theme.radius.xl,
          borderColor: theme.colors.gray[2],
          backgroundColor: theme.white,
          transition: 'border-color 120ms ease, box-shadow 120ms ease',

          '&:focus, &:focus-within': {
            borderColor: theme.colors.indigo[5],
            boxShadow: `0 0 0 3px color-mix(in srgb, ${theme.colors.indigo[5]} 14%, transparent)`,
          },
        },
      }),
    },
    Select: {
      styles: {
        input: {
          height: rem(52),
        },
      },
    },
    Textarea: {
      defaultProps: {
        size: 'md',
        radius: 'xl',
      },
      styles: (theme: MantineTheme) => ({
        input: {
          paddingTop: rem(14),
          paddingBottom: rem(14),
          lineHeight: theme.lineHeights.md,
        },
      }),
    },

    Paper: {
      defaultProps: {
        shadow: 'sm',
        radius: 'xl',
        withBorder: true,
      },
      styles: (theme: MantineTheme) => ({
        root: {
          backgroundColor: theme.white,
          borderColor: theme.colors.gray[2],
        },
      }),
    },

    Card: {
      defaultProps: {
        radius: 'xl',
        shadow: 'sm',
        withBorder: true,
        padding: 'lg',
      },
      styles: (theme: MantineTheme) => ({
        root: {
          backgroundColor: theme.white,
          borderColor: theme.colors.gray[2],
        },
      }),
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
          borderSpacing: 0,
          overflow: 'hidden',
          backgroundColor: theme.white,
        },

        thead: {
          backgroundColor: theme.colors.gray[2],
        },

        th: {
          fontWeight: 600,
          fontSize: theme.fontSizes.xs,
          borderBottom: `1px solid ${theme.colors.gray[2]}`,
          letterSpacing: '0.02em',
        },

        td: {
          fontSize: theme.fontSizes.sm,
          color: theme.colors.gray[8],
          padding: `${rem(16)} ${rem(18)}`,
          borderBottom: `1px solid ${theme.colors.gray[1]}`,
          verticalAlign: 'middle',
        },

        tbody: {
          '& tr': {
            transition: 'background-color 120ms ease',
          },
          '& tr:hover': {
            backgroundColor: theme.colors.gray[0],
          },
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

    AppShell: {
      styles: (theme: MantineTheme) => ({
        main: {
          backgroundColor: theme.colors.gray[0],
        },
      }),
    },

    Notification: {
      defaultProps: {
        radius: 'xl',
        withBorder: true,
      },
      styles: (theme: MantineTheme, props: Record<string, unknown>) => {
        const colorKey = props.color as keyof typeof theme.colors | undefined
        const palette = colorKey ? theme.colors[colorKey] : undefined

        return {
          root: {
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            ...(palette && {
              backgroundColor: palette[0],
              borderColor: palette[3],
            }),
          },
          icon: {
            ...(palette && {
              borderRadius: theme.radius.full,
              backgroundColor: palette[1],
              color: palette[6],
              border: `1px solid ${palette[2]}`,
            }),
          },
          title: {
            color: palette ? palette[8] : theme.colors.gray[9],
            fontWeight: '600',
          },
          description: {
            color: palette ? palette[7] : theme.colors.gray[6],
          },
        }
      },
    },
  },
})
