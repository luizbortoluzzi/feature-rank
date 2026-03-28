import { type BadgeProps } from '@mantine/core'
import { ColoredBadge } from '../../../../components/colored-badge'
import type { Category } from '../../../../types/category'

interface CategoryBadgeProps {
  category: Category
  size?: BadgeProps['size']
}

export function CategoryBadge({ category, size }: CategoryBadgeProps) {
  return <ColoredBadge label={category.name} color={category.color} size={size} />
}
