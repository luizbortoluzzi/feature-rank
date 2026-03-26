import { Badge } from '../../../../components/badge'
import type { Status } from '../../../../types/status'

interface StatusBadgeProps {
  status: Status
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <Badge label={status.name} color={status.color} />
}
