import { Badge } from '@mantine/core'
import { IconBolt } from '@tabler/icons-react'
import { PRIORITY_CONFIG } from '../../../../constants/priority'

interface PriorityBadgeProps {
  rate: number
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

export function PriorityBadge({ rate, size = 'md' }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[rate] ?? PRIORITY_CONFIG[3]

  return (
    <Badge
      size={size}
      color={config.color}
      variant="light"
      radius="sm"
      leftSection={<IconBolt size={11} />}
      style={{ textTransform: 'none', fontWeight: 500 }}
    >
      {config.label}
    </Badge>
  )
}
