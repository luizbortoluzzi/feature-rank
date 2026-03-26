import { Badge as MantineBadge } from '@mantine/core'

interface BadgeProps {
  label: string
  /** A CSS color value (e.g. hex). Applied via inline style since Mantine color only accepts theme keys. */
  color?: string
  icon?: string
}

export function Badge({ label, color, icon }: BadgeProps) {
  const style = color
    ? { backgroundColor: `${color}20`, color, borderColor: `${color}40` }
    : undefined

  return (
    <MantineBadge variant="light" radius="sm" style={style}>
      {icon && <span aria-hidden="true" style={{ marginRight: 4 }}>{icon}</span>}
      {label}
    </MantineBadge>
  )
}
