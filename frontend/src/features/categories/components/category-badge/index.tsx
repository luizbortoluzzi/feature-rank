import { Badge } from '@mantine/core'
import type { Category } from '../../../../types/category'

interface CategoryBadgeProps {
  category: Category
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  return (
    <Badge
      variant="outline"
      radius="sm"
      color="gray"
      style={{ textTransform: 'none', fontWeight: 500 }}
    >
      {category.icon && <span style={{ marginRight: 4 }}>{category.icon}</span>}
      {category.name}
    </Badge>
  )
}
