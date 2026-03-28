import { type ReactNode } from 'react'
import { Badge, type BadgeProps } from '@mantine/core'

interface ColoredBadgeProps {
  label: string
  /** A CSS color value (e.g. hex). Applied via inline style since Mantine color only accepts theme keys. */
  color: string
  leftSection?: ReactNode
  size?: BadgeProps['size']
}

export function ColoredBadge({ label, color, leftSection, size = 'lg' }: ColoredBadgeProps) {
  return (
    <Badge
      size={size}
      variant="light"
      radius="sm"
      leftSection={leftSection}
      style={{
        backgroundColor: `${color}18`,
        color,
        borderColor: `${color}30`,
        textTransform: 'none',
        fontWeight: 500,
      }}
    >
      {label}
    </Badge>
  )
}
