import { ColorInput, type ColorInputProps } from '@mantine/core'

export function FormColorInput(props: ColorInputProps) {
  return <ColorInput size="md" format="hex" {...props} />
}
