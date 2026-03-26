import { Stack, Text, Anchor, UnstyledButton, ThemeIcon, Center } from '@mantine/core'
import { IconInbox } from '@tabler/icons-react'

interface EmptyStateProps {
  message: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <Center py="xl">
      <Stack align="center" gap="sm">
        <ThemeIcon size="xl" variant="light" color="gray" radius="xl">
          <IconInbox size={24} />
        </ThemeIcon>
        <Text size="sm" c="dimmed" ta="center">
          {message}
        </Text>
        {action && (
          action.href ? (
            <Anchor href={action.href} size="sm" fw={500}>
              {action.label}
            </Anchor>
          ) : (
            <UnstyledButton onClick={action.onClick}>
              <Text size="sm" fw={500} c="indigo">
                {action.label}
              </Text>
            </UnstyledButton>
          )
        )}
      </Stack>
    </Center>
  )
}
