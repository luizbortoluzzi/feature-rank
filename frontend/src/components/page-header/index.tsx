import { type ReactNode, type ElementType } from 'react'
import { Group, Box, Title, Text } from '@mantine/core'

interface PageHeaderProps {
  icon?: ElementType
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function PageHeader({ icon: Icon, title, subtitle, actions }: PageHeaderProps) {
  return (
    <Group
      justify="space-between"
      align="center"
      style={{
        marginTop: 'calc(-1 * var(--mantine-spacing-md))',
        marginLeft: 'calc(-1 * var(--mantine-spacing-md))',
        marginRight: 'calc(-1 * var(--mantine-spacing-md))',
        marginBottom: 'var(--mantine-spacing-md)',
        padding: 'var(--mantine-spacing-sm) var(--mantine-spacing-md)',
        backgroundColor: 'var(--mantine-color-body)',
        borderBottom: '1px solid var(--mantine-color-gray-2)',
      }}
    >
      <Group gap="sm" align="center">
        {Icon && (
          <Box
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              backgroundColor: 'var(--mantine-color-indigo-0)',
              border: '1px solid var(--mantine-color-indigo-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={18} color="var(--mantine-color-indigo-6)" stroke={1.75} />
          </Box>
        )}
        <Box>
          <Title order={2} fz="lg">
            {title}
          </Title>
          {subtitle && (
            <Text c="dimmed" fz="sm" mt={2}>
              {subtitle}
            </Text>
          )}
        </Box>
      </Group>

      {actions && <Group gap="sm">{actions}</Group>}
    </Group>
  )
}
