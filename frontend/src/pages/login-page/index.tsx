import { Navigate } from 'react-router-dom'
import { useMediaQuery } from '@mantine/hooks'
import { MD_BREAKPOINT, PAGE_MAX_WIDTH } from '../../constants/layout'
import { Avatar, Box, Divider, Group, Stack, Text } from '@mantine/core'
import { IconStack2, IconCheck, IconUsers, IconTrendingUp } from '@tabler/icons-react'
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
          : 'linear-gradient(135deg, #2a1260 0%, #16245e 40%, #1e1258 70%, #0f1d52 100%)',
      }}
    >
      {/* Keyframe animations for aurora orbs */}
      {!isMobile && (
        <style>{`
          @keyframes orb-drift-1 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            25%       { transform: translate(50px, -40px) scale(1.07); }
            50%       { transform: translate(-30px, 50px) scale(0.94); }
            75%       { transform: translate(40px, 25px) scale(1.04); }
          }
          @keyframes orb-drift-2 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33%       { transform: translate(-60px, 35px) scale(1.09); }
            66%       { transform: translate(45px, -50px) scale(0.92); }
          }
          @keyframes orb-drift-3 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50%       { transform: translate(40px, 40px) scale(1.06); }
          }
          @keyframes orb-drift-4 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            40%       { transform: translate(-35px, -45px) scale(1.05); }
            80%       { transform: translate(50px, 20px) scale(0.96); }
          }
        `}</style>
      )}

      {/* Aurora orbs — desktop only */}
      {!isMobile && (
        <>
          {/* Top-left — vivid violet */}
          <Box
            style={{
              position: 'absolute',
              top: '-180px',
              left: '-150px',
              width: '700px',
              height: '700px',
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(124,58,237,0.70) 0%, rgba(109,40,217,0.35) 45%, transparent 70%)',
              filter: 'blur(55px)',
              pointerEvents: 'none',
              animation: 'orb-drift-1 18s ease-in-out infinite',
            }}
          />

          {/* Bottom-right — deep indigo */}
          <Box
            style={{
              position: 'absolute',
              bottom: '-200px',
              right: '-140px',
              width: '750px',
              height: '750px',
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(67,56,202,0.65) 0%, rgba(79,70,229,0.30) 48%, transparent 70%)',
              filter: 'blur(60px)',
              pointerEvents: 'none',
              animation: 'orb-drift-2 22s ease-in-out infinite',
            }}
          />

          {/* Top-right — rose accent for contrast */}
          <Box
            style={{
              position: 'absolute',
              top: '-80px',
              right: '-60px',
              width: '500px',
              height: '500px',
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(225,29,72,0.30) 0%, rgba(244,63,94,0.12) 50%, transparent 72%)',
              filter: 'blur(50px)',
              pointerEvents: 'none',
              animation: 'orb-drift-3 14s ease-in-out infinite',
            }}
          />

          {/* Center-left — bright purple glow */}
          <Box
            style={{
              position: 'absolute',
              top: '25%',
              left: '10%',
              width: '480px',
              height: '480px',
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(168,85,247,0.50) 0%, rgba(139,92,246,0.20) 50%, transparent 72%)',
              filter: 'blur(65px)',
              pointerEvents: 'none',
              animation: 'orb-drift-4 16s ease-in-out infinite',
            }}
          />

          {/* Bottom-left — cyan-blue cool accent */}
          <Box
            style={{
              position: 'absolute',
              bottom: '5%',
              left: '3%',
              width: '380px',
              height: '380px',
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(6,182,212,0.22) 0%, rgba(14,165,233,0.10) 55%, transparent 75%)',
              filter: 'blur(48px)',
              pointerEvents: 'none',
              animation: 'orb-drift-2 20s ease-in-out infinite reverse',
            }}
          />
        </>
      )}

      {/* Mobile orbs */}
      {isMobile && (
        <>
          <Box
            style={{
              position: 'absolute',
              top: '-120px',
              left: '-100px',
              width: '480px',
              height: '480px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)',
              filter: 'blur(40px)',
              pointerEvents: 'none',
            }}
          />
          <Box
            style={{
              position: 'absolute',
              bottom: '-140px',
              right: '-80px',
              width: '520px',
              height: '520px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.10) 0%, transparent 70%)',
              filter: 'blur(50px)',
              pointerEvents: 'none',
            }}
          />
        </>
      )}

      <Box
        maw={PAGE_MAX_WIDTH}
        w="100%"
        mx="auto"
        px={isMobile ? 'md' : 0}
        style={{
          borderRadius: isMobile ? 0 : 'var(--mantine-radius-lg)',
          boxShadow: isMobile
            ? 'none'
            : '0 40px 100px rgba(0,0,0,0.60), 0 0 0 1px rgba(255,255,255,0.07)',
          overflow: 'hidden',
          display: 'flex',
          minHeight: isMobile ? '100vh' : undefined,
          position: 'relative',
          zIndex: 1,
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
            <Box
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--mantine-radius-md)',
                backgroundColor: 'rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconStack2 size={36} color="white" />
            </Box>
            <Text fw={600} fz="lg" c="white">
              Feature Rank
            </Text>
          </Group>

          <Stack gap="sm" mt="xl">
            <Text component="h2" fz={28} fw={700} lh={1.3} c="white" style={{ margin: 0 }}>
              Welcome Back to Your Feature Hub
            </Text>
            <Text fz="sm" c="rgba(255,255,255,0.8)">
              Track, vote, and collaborate on feature requests. Join thousands of teams building
              better products together.
            </Text>
          </Stack>

          <Stack gap="md" mt="xl">
            {FEATURE_ITEMS.map((item) => (
              <Group key={item.title} gap="sm" wrap="nowrap" align="flex-start">
                <Box
                  style={{
                    width: 36,
                    height: 36,
                    minWidth: 36,
                    borderRadius: 'var(--mantine-radius-md)',
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <item.icon size={18} color="white" />
                </Box>
                <Box>
                  <Text fw={600} fz="sm" c="white">
                    {item.title}
                  </Text>
                  <Text fz="xs" c="rgba(255,255,255,0.75)">
                    {item.description}
                  </Text>
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
                  style={{
                    marginLeft: index === 0 ? 0 : -8,
                    border: '2px solid rgba(255,255,255,0.3)',
                  }}
                >
                  {item.initial}
                </Avatar>
              ))}
            </Group>
            <Box>
              <Text fw={600} fz="sm" c="white">
                Join 12,000+ users
              </Text>
              <Text fz="xs" c="rgba(255,255,255,0.75)">
                Building amazing products
              </Text>
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
