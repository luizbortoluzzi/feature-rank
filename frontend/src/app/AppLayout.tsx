import type { ReactNode } from 'react'
import {
  AppShell,
  NavLink,
  Group,
  Stack,
  Text,
  Avatar,
  ActionIcon,
  TextInput,
  Button,
  Divider,
  Box,
} from '@mantine/core'
import {
  IconLayoutDashboard,
  IconPlus,
  IconThumbUp,
  IconShield,
  IconSettings,
  IconSearch,
} from '@tabler/icons-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useCurrentUser } from './AuthProvider'

interface AppLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
}

export function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  const { user } = useCurrentUser()
  const location = useLocation()
  const navigate = useNavigate()

  const navLinks = [
    { label: 'Feature Board', icon: IconLayoutDashboard, path: '/' },
    { label: 'Submit Idea', icon: IconPlus, path: '/features/new' },
    { label: 'My Votes', icon: IconThumbUp, path: '/my-votes' },
  ]

  const adminLinks = [{ label: 'Admin Console', icon: IconShield, path: '/admin' }]

  function isActive(path: string): boolean {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const userInitials = user
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  return (
    <AppShell navbar={{ width: 220, breakpoint: 'sm' }} header={{ height: 60 }} padding="md">
      <AppShell.Header
        style={{
          backgroundColor: 'var(--mantine-color-white)',
          borderBottom: '1px solid var(--mantine-color-gray-2)',
        }}
      >
        <Group h="100%" px="md" justify="space-between">
          <Stack gap={0}>
            <Text fw={600} size="md" lh={1.3}>
              {title}
            </Text>
            {subtitle && (
              <Text size="xs" c="dimmed" lh={1.3}>
                {subtitle}
              </Text>
            )}
          </Stack>

          <Group gap="sm">
            <TextInput
              placeholder="Search features…"
              leftSection={<IconSearch size={14} />}
              size="sm"
              radius="md"
              style={{ width: 220 }}
            />
            <Button
              size="sm"
              radius="md"
              leftSection={<IconPlus size={14} />}
              onClick={() => navigate('/features/new')}
            >
              New Request
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar
        p="sm"
        style={{
          backgroundColor: 'var(--mantine-color-white)',
          borderRight: '1px solid var(--mantine-color-gray-2)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box mb="sm">
          <Group gap="xs" px="xs" py="sm">
            <Box
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                backgroundColor: 'var(--mantine-color-indigo-6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text size="xs" fw={700} c="white">
                FR
              </Text>
            </Box>
            <Text fw={700} size="sm">
              Feature Rank
            </Text>
          </Group>

          <Divider mb="sm" />

          <Stack gap={4}>
            {navLinks.map(({ label, icon: Icon, path }) => (
              <NavLink
                key={path}
                label={label}
                leftSection={<Icon size={16} />}
                active={isActive(path)}
                onClick={() => navigate(path)}
                style={{ borderRadius: 'var(--mantine-radius-md)' }}
              />
            ))}
          </Stack>

          {user?.is_admin && (
            <>
              <Divider my="sm" label="Admin" labelPosition="left" />
              <Stack gap={4}>
                {adminLinks.map(({ label, icon: Icon, path }) => (
                  <NavLink
                    key={path}
                    label={label}
                    leftSection={<Icon size={16} />}
                    active={isActive(path)}
                    onClick={() => navigate(path)}
                    style={{ borderRadius: 'var(--mantine-radius-md)' }}
                  />
                ))}
              </Stack>
            </>
          )}
        </Box>

        <Box mt="auto">
          <Divider mb="sm" />
          {user && (
            <Group gap="sm" px="xs" py="xs" wrap="nowrap">
              <Avatar radius="xl" size="sm" color="indigo">
                {userInitials}
              </Avatar>
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Text size="sm" fw={500} truncate>
                  {user.name}
                </Text>
                <Text size="xs" c="dimmed" truncate>
                  {user.email}
                </Text>
              </Box>
              <ActionIcon variant="subtle" color="gray" size="sm" aria-label="Settings">
                <IconSettings size={14} />
              </ActionIcon>
            </Group>
          )}
        </Box>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  )
}
