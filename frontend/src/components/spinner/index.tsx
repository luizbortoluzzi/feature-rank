import { Center, Loader, type LoaderProps } from '@mantine/core'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

const sizeMap: Record<NonNullable<SpinnerProps['size']>, LoaderProps['size']> = {
  sm: 'xs',
  md: 'sm',
  lg: 'md',
}

export function Spinner({ size = 'md', label = 'Loading…' }: SpinnerProps) {
  return (
    <Center>
      <Loader size={sizeMap[size]} aria-label={label} />
    </Center>
  )
}
