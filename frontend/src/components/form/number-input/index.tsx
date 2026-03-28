import { NumberInput, type NumberInputProps } from '@mantine/core'

export function FormNumberInput(props: NumberInputProps) {
  return <NumberInput size="md" min={0} {...props} />
}
