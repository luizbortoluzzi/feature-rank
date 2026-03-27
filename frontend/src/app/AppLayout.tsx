import { type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  AppShell,
  Avatar,
  ActionIcon,
  Group,
  Text,
  NavLink,
  Box,
  Divider,
} from '@mantine/core'
import {
  IconLayoutList,
  IconTag,
  IconCircleDot,
  IconUsers,
  IconStack2,
  IconLogout,
} from '@tabler/icons-react'
import { useCurrentUser } from './AuthProvider'

interface AppLayoutProps {
  children: ReactNode
}

const navLinks = [
  { label: 'Features', icon: IconLayoutList, path: '/features' },
  { label: 'Categories', icon: IconTag, path: '/categories' },
  { label: 'Status', icon: IconCircleDot, path: '/statuses' },
]

const adminLinks = [
  { label: 'Users', icon: IconUsers, path: '/admin/users' },
]

function isActive(path: string, locationPathname: string): boolean {
  if (path === '/features')
    return locationPathname === '/features' || locationPathname === '/'
  return locationPathname.startsWith(path)
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useCurrentUser()

  const userInitials = user
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  return (
    <AppShell
      navbar={{ width: 240, breakpoint: 'sm' }}
      padding="md"
    >
      <AppShell.Navbar p="sm">
        {/* Brand */}
        <Group gap="sm" mb="xl" mt="xs">
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
            <IconStack2 size={20} color="white" />
          </Box>
          <Text fw={700} fz="md">
            Feature Rank
          </Text>
        </Group>

        {/* Nav links */}
        {navLinks.map((link) => (
          <NavLink
            key={link.path}
            label={link.label}
            leftSection={<link.icon size={18} stroke={1.5} />}
            active={isActive(link.path, location.pathname)}
            onClick={() => navigate(link.path)}
            variant="light"
            mb={2}
          />
        ))}

        {/* Admin section */}
        {user?.is_admin && (
          <>
            <Divider
              label="ADMIN"
              labelPosition="left"
              my="sm"
              styles={{
                label: {
                  fontSize: 'var(--mantine-font-size-xs)',
                  color: 'var(--mantine-color-dimmed)',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                },
              }}
            />
            {adminLinks.map((link) => (
              <NavLink
                key={link.path}
                label={link.label}
                leftSection={<link.icon size={18} stroke={1.5} />}
                active={isActive(link.path, location.pathname)}
                onClick={() => navigate(link.path)}
                variant="light"
                mb={2}
              />
            ))}
          </>
        )}
        {/* User profile strip */}
        {user && (
          <>
            <Divider mt="auto" mb="sm" />
            <Group gap="sm" px={4} wrap="nowrap">
              <Avatar size={32} radius="xl" color="indigo" src={user.avatar_url ?? undefined}>
                {userInitials}
              </Avatar>
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Text fz="sm" fw={500} truncate>
                  {user.name}
                </Text>
                <Text fz="xs" c="dimmed" truncate>
                  {user.email}
                </Text>
              </Box>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                aria-label="Log out"
                onClick={() => void logout()}
              >
                <IconLogout size={16} />
              </ActionIcon>
            </Group>
          </>
        )}
      </AppShell.Navbar>

      <AppShell.Main style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
        {children}
      </AppShell.Main>
    </AppShell>
  )
}
