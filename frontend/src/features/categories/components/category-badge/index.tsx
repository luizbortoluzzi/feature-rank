import { Badge } from '../../../../components/badge'
import type { Category } from '../../../../types/category'

interface CategoryBadgeProps {
  category: Category
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  return <Badge label={category.name} color={category.color} icon={category.icon} />
}
