import { forwardRef } from 'react'
import { Group, Stack, Text, TextInput, type TextInputProps } from '@mantine/core'

interface FormTextInputProps extends TextInputProps {
  charLimit?: number
  charCount?: number
  helperText?: string
}

export const FormTextInput = forwardRef<HTMLInputElement, FormTextInputProps>(
  function FormTextInput({ charLimit, charCount = 0, helperText, ...props }, ref) {
    const showExtra = Boolean(helperText || charLimit !== undefined)
    const counterColor =
      charCount > (charLimit ?? 0) * 0.9
        ? 'red'
        : charCount > (charLimit ?? 0) * 0.7
          ? 'yellow.7'
          : 'dimmed'

    if (!showExtra) {
      return <TextInput ref={ref} size="md" {...props} />
    }

    return (
      <Stack gap="xs">
        <TextInput ref={ref} size="md" maxLength={charLimit} {...props} />
        <Group justify="space-between" px={8}>
          <Text fz="xs" c="dimmed">
            {helperText}
          </Text>
          {charLimit !== undefined && (
            <Text fz="xs" c={counterColor}>
              {charCount} / {charLimit}
            </Text>
          )}
        </Group>
      </Stack>
    )
  },
)
