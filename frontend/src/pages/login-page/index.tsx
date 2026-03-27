import { Navigate } from 'react-router-dom'
import { useMediaQuery } from '@mantine/hooks'
import { MD_BREAKPOINT } from '../../hooks/use-is-mobile'
import {
  Avatar,
  Box,
  Divider,
  Group,
  Stack,
  Text,
} from '@mantine/core'
import {
  IconStack2,
  IconCheck,
  IconUsers,
  IconTrendingUp,
} from '@tabler/icons-react'
import { useCurrentUser } from '../../app/AuthProvider'
import { useLogin } from '../../features/auth/hooks/use-login'
import { LoginForm } from './login-form'

const FEATURE_ITEMS = [
  {
    icon: IconCheck,
    title: 'Prioritize Features',
    description: 'Vote and rank features that matter most to your users',
  },
  {
    icon: IconUsers,
    title: 'Team Collaboration',
    description: 'Work together with your team on product roadmaps',
  },
  {
    icon: IconTrendingUp,
    title: 'Track Progress',
    description: 'Monitor feature development from idea to launch',
  },
] as const

const AVATAR_ITEMS = [
  { initial: 'A', color: 'indigo' },
  { initial: 'B', color: 'violet' },
  { initial: 'C', color: 'grape' },
  { initial: 'D', color: 'indigo' },
] as const

export function LoginPage() {
  const { user, isLoading } = useCurrentUser()
  const loginMutation = useLogin()
  const isMobile = useMediaQuery(MD_BREAKPOINT)

  if (isLoading) return null
  if (user) return <Navigate to="/" replace />

  return (
    <Box
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'center',
        padding: isMobile ? '24px 16px' : 0,
        position: 'relative',
        overflow: 'hidden',
        background: isMobile
          ? 'linear-gradient(135deg, #5B21B6 0%, #4338CA 50%, #6366F1 100%)'
          : 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 40%, #EDE9FE 70%, #E0E7FF 100%)',
      }}
    >
      {/* Decorative background orbs */}
      <Box style={{ position: 'absolute', top: '-120px', left: '-100px', width: '480px', height: '480px', borderRadius: '50%', background: isMobile ? 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, rgba(139,92,246,0.10) 60%, transparent 100%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
      <Box style={{ position: 'absolute', bottom: '-140px', right: '-80px', width: '520px', height: '520px', borderRadius: '50%', background: isMobile ? 'radial-gradient(circle, rgba(255,255,255,0.10) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(139,92,246,0.22) 0%, rgba(99,102,241,0.10) 60%, transparent 100%)', filter: 'blur(50px)', pointerEvents: 'none' }} />
      <Box style={{ position: 'absolute', top: '40%', right: '10%', width: '260px', height: '260px', borderRadius: '50%', background: isMobile ? 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(167,139,250,0.18) 0%, transparent 70%)', filter: 'blur(30px)', pointerEvents: 'none' }} />
      <Box style={{ position: 'absolute', bottom: '15%', left: '8%', width: '200px', height: '200px', borderRadius: '50%', background: isMobile ? 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(79,70,229,0.15) 0%, transparent 70%)', filter: 'blur(28px)', pointerEvents: 'none' }} />

      <Box
        maw={960}
        w="100%"
        mx="auto"
        px={isMobile ? 'md' : 0}
        style={{
          borderRadius: isMobile ? 0 : 'var(--mantine-radius-lg)',
          boxShadow: isMobile ? 'none' : 'var(--mantine-shadow-md)',
          overflow: 'hidden',
          display: 'flex',
          minHeight: isMobile ? '100vh' : undefined,
        }}
      >
        {/* Left panel — hidden on mobile */}
        <Box
          style={{
            width: '45%',
            background: 'linear-gradient(135deg, #5B21B6 0%, #4338CA 50%, #6366F1 100%)',
            padding: 40,
            display: isMobile ? 'none' : 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Group gap="sm">
            <Box style={{ width: 44, height: 44, borderRadius: 'var(--mantine-radius-md)', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconStack2 size={36} color="white" />
            </Box>
            <Text fw={600} fz="lg" c="white">Feature Rank</Text>
          </Group>

          <Stack gap="sm" mt="xl">
            <Text component="h2" fz={28} fw={700} lh={1.3} c="white" style={{ margin: 0 }}>
              Welcome Back to Your Feature Hub
            </Text>
            <Text fz="sm" c="rgba(255,255,255,0.8)">
              Track, vote, and collaborate on feature requests. Join thousands of teams building better products together.
            </Text>
          </Stack>

          <Stack gap="md" mt="xl">
            {FEATURE_ITEMS.map((item) => (
              <Group key={item.title} gap="sm" wrap="nowrap" align="flex-start">
                <Box style={{ width: 36, height: 36, minWidth: 36, borderRadius: 'var(--mantine-radius-md)', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <item.icon size={18} color="white" />
                </Box>
                <Box>
                  <Text fw={600} fz="sm" c="white">{item.title}</Text>
                  <Text fz="xs" c="rgba(255,255,255,0.75)">{item.description}</Text>
                </Box>
              </Group>
            ))}
          </Stack>

          <Divider my="lg" style={{ borderColor: 'rgba(255,255,255,0.2)' }} />

          <Group gap="sm" wrap="nowrap">
            <Group gap={0}>
              {AVATAR_ITEMS.map((item, index) => (
                <Avatar
                  key={item.initial}
                  size={32}
                  radius="xl"
                  color={item.color}
                  style={{ marginLeft: index === 0 ? 0 : -8, border: '2px solid rgba(255,255,255,0.3)' }}
                >
                  {item.initial}
                </Avatar>
              ))}
            </Group>
            <Box>
              <Text fw={600} fz="sm" c="white">Join 12,000+ users</Text>
              <Text fz="xs" c="rgba(255,255,255,0.75)">Building amazing products</Text>
            </Box>
          </Group>
        </Box>

        {/* Right panel — login form */}
        <LoginForm
          onSubmit={(data) => loginMutation.login(data)}
          isPending={loginMutation.isPending}
          error={loginMutation.error}
          isMobile={isMobile ?? false}
        />
      </Box>
    </Box>
  )
}
