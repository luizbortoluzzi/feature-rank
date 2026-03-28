import { Box } from '@mantine/core'
import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface CategoryIconProps {
  icon: string
  color: string
}

export function CategoryIcon({ icon, color }: CategoryIconProps) {
  const IconComponent = (LucideIcons as unknown as Record<string, LucideIcon>)[icon]
  return (
    <Box
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        backgroundColor: color || '#e9ecef',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {IconComponent ? (
        <IconComponent size={16} color="white" />
      ) : (
        <span style={{ fontSize: 14 }}>{icon}</span>
      )}
    </Box>
  )
}
