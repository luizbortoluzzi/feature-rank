import { Button as MantineButton, type ButtonProps as MantineButtonProps } from '@mantine/core'
import type { ReactNode } from 'react'

type CustomVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
type CustomSize = 'sm' | 'md' | 'lg'

interface ButtonProps
  extends Omit<MantineButtonProps, 'variant' | 'size' | 'loading'> {
  children: ReactNode
  variant?: CustomVariant
  size?: CustomSize
  isLoading?: boolean
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  'aria-label'?: string
  'aria-pressed'?: boolean | 'true' | 'false' | 'mixed'
}

const variantMap: Record<CustomVariant, MantineButtonProps['variant']> = {
  primary: 'filled',
  secondary: 'light',
  danger: 'filled',
  ghost: 'subtle',
}

const colorMap: Record<CustomVariant, MantineButtonProps['color']> = {
  primary: 'indigo',
  secondary: 'gray',
  danger: 'red',
  ghost: 'gray',
}

const sizeMap: Record<CustomSize, MantineButtonProps['size']> = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <MantineButton
      variant={variantMap[variant]}
      color={colorMap[variant]}
      size={sizeMap[size]}
      loading={isLoading}
      disabled={disabled || isLoading}
      radius="md"
      {...rest}
    >
      {children}
    </MantineButton>
  )
}
