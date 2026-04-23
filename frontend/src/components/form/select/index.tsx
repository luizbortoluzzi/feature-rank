import { Select, type SelectProps } from '@mantine/core'

interface FormSelectProps extends SelectProps {
  isLoading?: boolean
}

export function FormSelect({ isLoading, placeholder, disabled, ...props }: FormSelectProps) {
  return (
    <Select
      size="md"
      searchable
      nothingFoundMessage="No results found"
      placeholder={isLoading ? 'Loading…' : placeholder}
      disabled={isLoading || disabled}
      {...props}
    />
  )
}
