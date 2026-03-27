import { Stack, Text } from '@mantine/core'
import { IconUsers } from '@tabler/icons-react'
import { PageHeader } from '../../components/page-header'

export function UsersPage() {
  return (
    <Stack>
      <PageHeader icon={IconUsers} title="Users" subtitle="Manage user accounts and roles" />
      <Text c="dimmed">This feature is coming soon.</Text>
    </Stack>
  )
}
