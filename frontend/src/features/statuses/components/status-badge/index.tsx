import { Badge, type BadgeProps } from '@mantine/core'
import type { Status } from '../../../../types/status'

interface StatusBadgeProps {
  status: Status
  size?: BadgeProps['size']
}

export function StatusBadge({ status, size }: StatusBadgeProps) {
  return (
    <Badge
      size={size}
      leftSection={
        <span
          style={{
            display: 'inline-block',
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: status.color,
          }}
        />
      }
      variant="light"
      radius="sm"
      style={{
        backgroundColor: `${status.color}18`,
        color: status.color,
        borderColor: `${status.color}30`,
        textTransform: 'none',
        fontWeight: 500,
      }}
    >
      {status.name}
    </Badge>
  )
}
