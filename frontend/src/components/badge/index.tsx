import { ColoredBadge } from '../colored-badge'

interface BadgeProps {
  label: string
  /** A CSS color value (e.g. hex). Applied via inline style since Mantine color only accepts theme keys. */
  color?: string
  icon?: string
}

export function Badge({ label, color = '#868e96', icon }: BadgeProps) {
  const leftSection = icon ? (
    <span aria-hidden="true" style={{ marginRight: 4 }}>
      {icon}
    </span>
  ) : undefined

  return <ColoredBadge label={label} color={color} leftSection={leftSection} />
}
