import { type ReactNode, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  AppShell,
  Avatar,
  ActionIcon,
  Burger,
  Group,
  Text,
  NavLink,
  Box,
  Divider,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useIsMobile } from '../hooks/use-is-mobile'
import {
  IconLayoutList,
  IconTag,
  IconCircleDot,
  IconUsers,
  IconLogout,
} from '@tabler/icons-react'
import { useCurrentUser } from './AuthProvider'
import { registerNavigate } from '../services/navigation'

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
  const [opened, { toggle, close }] = useDisclosure()
  const isMobile = useIsMobile()

  useEffect(() => {
    registerNavigate(navigate)
  }, [navigate])

  const userInitials = user
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  function handleNavigate(path: string) {
    navigate(path)
    close()
  }

  return (
    <AppShell
      navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      header={{ height: 60, collapsed: !isMobile }}
      padding="md"
    >
      {/* Mobile header */}
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <img src="/logo.svg" alt="Feature Rank" style={{ width: 200 }} />
          <Burger opened={opened} onClick={toggle} size="sm" aria-label="Toggle navigation" />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        {/* Brand — desktop only (hidden on mobile since header shows it) */}
        {!isMobile && (
          <Group gap="sm" mb="xl" mt="xs" justify="center">
            <img src="/logo.svg" alt="Feature Rank" style={{ width: '95%' }} />
          </Group>
        )}

        {/* Nav links */}
        {navLinks.map((link) => {
          const active = isActive(link.path, location.pathname)
          return (
            <NavLink
              key={link.path}
              label={link.label}
              leftSection={<link.icon size={18} stroke={1.5} />}
              active={active}
              onClick={() => handleNavigate(link.path)}
              variant="filled"
              color="indigo"
              mb={2}
              styles={{ label: { fontWeight: 600 }, root: { borderRadius: 'var(--mantine-radius-md)' } }}
              style={active ? {
                background: 'linear-gradient(135deg, var(--mantine-color-indigo-6) 0%, var(--mantine-color-violet-5) 100%)',
              } : undefined}
            />
          )
        })}

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
            {adminLinks.map((link) => {
              const active = isActive(link.path, location.pathname)
              return (
                <NavLink
                  key={link.path}
                  label={link.label}
                  leftSection={<link.icon size={18} stroke={1.5} />}
                  active={active}
                  onClick={() => handleNavigate(link.path)}
                  variant="filled"
                  color="indigo"
                  mb={2}
                  styles={{ label: { fontWeight: 600 }, root: { borderRadius: 'var(--mantine-radius-md)' } }}
                  style={active ? {
                    background: 'linear-gradient(135deg, var(--mantine-color-indigo-6) 0%, var(--mantine-color-violet-5) 100%)',
                  } : undefined}
                />
              )
            })}
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
