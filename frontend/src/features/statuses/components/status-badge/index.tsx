import { type BadgeProps } from '@mantine/core'
import { ColoredBadge } from '../../../../components/colored-badge'
import type { Status } from '../../../../types/status'

interface StatusBadgeProps {
  status: Status
  size?: BadgeProps['size']
}

export function StatusBadge({ status, size }: StatusBadgeProps) {
  const dot = (
    <span
      style={{
        display: 'inline-block',
        width: 6,
        height: 6,
        borderRadius: '50%',
        backgroundColor: status.color,
      }}
    />
  )

  return <ColoredBadge label={status.name} color={status.color} leftSection={dot} size={size} />
}
