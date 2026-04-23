import { forwardRef } from 'react'
import { Stack, Text, Textarea, type TextareaProps } from '@mantine/core'

interface FormTextareaProps extends TextareaProps {
  helperText?: string
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  function FormTextarea({ helperText, ...props }, ref) {
    if (!helperText) {
      return <Textarea ref={ref} size="md" autosize minRows={5} maxRows={10} {...props} />
    }

    return (
      <Stack gap="xs">
        <Textarea ref={ref} size="md" autosize minRows={5} maxRows={10} {...props} />
        <Text fz="xs" c="dimmed" px={8}>
          {helperText}
        </Text>
      </Stack>
    )
  },
)
