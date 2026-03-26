import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Navigate } from 'react-router-dom'
import {
  Alert,
  Anchor,
  Avatar,
  Box,
  Button,
  Checkbox,
  Divider,
  Group,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core'
import {
  IconStack2,
  IconCheck,
  IconUsers,
  IconTrendingUp,
  IconMail,
  IconLock,
  IconBrandGithub,
  IconAlertCircle,
} from '@tabler/icons-react'
import { useCurrentUser } from '../app/AuthProvider'
import { useLogin } from '../features/auth/hooks/use-login'
import type { LoginPayload } from '../services/auth'

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
)

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

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<LoginPayload>({
    defaultValues: {
      username: '',
      password: '',
    },
  })

  useEffect(() => {
    if (loginMutation.error?.details) {
      Object.entries(loginMutation.error.details).forEach(([field, messages]) => {
        if (field === 'username' || field === 'password') {
          setError(field, { message: messages[0] })
        }
      })
    }
  }, [loginMutation.error, setError])

  if (isLoading) {
    return null
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  const onSubmit = (data: LoginPayload) => {
    loginMutation.login(data)
  }

  const nonFieldError = loginMutation.error && !loginMutation.error.details
    ? loginMutation.error.message
    : null

  return (
    <Box
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--mantine-color-gray-0)',
      }}
    >
      <Box
        maw={960}
        w="100%"
        mx="auto"
        style={{
          borderRadius: 'var(--mantine-radius-lg)',
          boxShadow: 'var(--mantine-shadow-md)',
          overflow: 'hidden',
          display: 'flex',
        }}
      >
        {/* Left panel */}
        <Box
          style={{
            width: '45%',
            background:
              'linear-gradient(135deg, #5B21B6 0%, #4338CA 50%, #6366F1 100%)',
            padding: 40,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {/* Brand row */}
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

          {/* Headline and subtitle */}
          <Stack gap="sm" mt="xl">
            <Text
              component="h2"
              fz={28}
              fw={700}
              lh={1.3}
              c="white"
              style={{ margin: 0 }}
            >
              Welcome Back to Your Feature Hub
            </Text>
            <Text fz="sm" c="rgba(255,255,255,0.8)">
              Track, vote, and collaborate on feature requests. Join thousands
              of teams building better products together.
            </Text>
          </Stack>

          {/* Feature list */}
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

          {/* Divider */}
          <Divider
            my="lg"
            style={{ borderColor: 'rgba(255,255,255,0.2)' }}
          />

          {/* Social proof row */}
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

        {/* Right panel */}
        <Box
          style={{
            width: '55%',
            backgroundColor: 'white',
            padding: 40,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Stack gap="lg">
            {/* Header */}
            <Box>
              <Text fw={700} fz={24}>
                Sign In
              </Text>
              <Text fz="sm" c="dimmed">
                Welcome back! Please enter your details.
              </Text>
            </Box>

            {/* Social buttons */}
            <Stack gap="sm">
              <Tooltip label="Coming soon" position="top">
                <Button
                  variant="default"
                  radius="md"
                  size="md"
                  fullWidth
                  disabled
                  leftSection={<GoogleIcon />}
                >
                  Continue with Google
                </Button>
              </Tooltip>
              <Tooltip label="Coming soon" position="top">
                <Button
                  variant="default"
                  radius="md"
                  size="md"
                  fullWidth
                  disabled
                  leftSection={<IconBrandGithub size={16} />}
                >
                  Continue with GitHub
                </Button>
              </Tooltip>
            </Stack>

            {/* Divider */}
            <Divider
              label="Or continue with email"
              labelPosition="center"
              styles={{
                label: {
                  color: 'var(--mantine-color-dimmed)',
                  fontSize: 'var(--mantine-font-size-xs)',
                },
              }}
            />

            {/* Non-field error */}
            {nonFieldError && (
              <Alert
                color="red"
                icon={<IconAlertCircle size={16} />}
                variant="light"
              >
                {nonFieldError}
              </Alert>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack gap="md">
                <TextInput
                  label="Email Address"
                  placeholder="you@example.com"
                  leftSection={<IconMail size={16} />}
                  radius="md"
                  error={errors.username?.message}
                  {...register('username', {
                    required: 'Email is required.',
                  })}
                />

                <Controller
                  name="password"
                  control={control}
                  rules={{ required: 'Password is required.' }}
                  render={({ field }) => (
                    <PasswordInput
                      label="Password"
                      placeholder="Enter your password"
                      leftSection={<IconLock size={16} />}
                      radius="md"
                      error={errors.password?.message}
                      {...field}
                    />
                  )}
                />

                <Group justify="space-between">
                  <Checkbox label="Remember me" />
                  <Anchor href="#" fz="sm" c="indigo">
                    Forgot password?
                  </Anchor>
                </Group>

                <Button
                  type="submit"
                  fullWidth
                  size="md"
                  radius="md"
                  variant="filled"
                  color="indigo"
                  loading={loginMutation.isPending}
                >
                  Sign In
                </Button>

                <Text fz="sm" ta="center">
                  Don&apos;t have an account?{' '}
                  <Anchor href="#" c="indigo">
                    Sign up for free
                  </Anchor>
                </Text>
              </Stack>
            </form>

            {/* Footer */}
            <Group justify="center" gap="xs">
              <Anchor fz="xs" c="dimmed" href="#">
                Privacy Policy
              </Anchor>
              <Text c="dimmed" fz="xs">
                ·
              </Text>
              <Anchor fz="xs" c="dimmed" href="#">
                Terms of Service
              </Anchor>
              <Text c="dimmed" fz="xs">
                ·
              </Text>
              <Anchor fz="xs" c="dimmed" href="#">
                Help Center
              </Anchor>
            </Group>
          </Stack>
        </Box>
      </Box>
    </Box>
  )
}
