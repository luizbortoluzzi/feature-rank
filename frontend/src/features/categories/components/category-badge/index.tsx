import { Badge, type BadgeProps } from '@mantine/core'
import type { Category } from '../../../../types/category'

interface CategoryBadgeProps {
  category: Category
  size?: BadgeProps['size']
}

export function CategoryBadge({ category, size }: CategoryBadgeProps) {
  return (
    <Badge
      size={size}
      variant="light"
      radius="sm"
      style={{
        backgroundColor: `${category.color}18`,
        color: category.color,
        borderColor: `${category.color}30`,
        textTransform: 'none',
        fontWeight: 500,
      }}
    >
      {category.name}
    </Badge>
  )
}
