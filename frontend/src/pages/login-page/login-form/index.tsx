import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import {
  Alert,
  Anchor,
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
import { IconBrandGithub, IconAlertCircle, IconMail, IconLock } from '@tabler/icons-react'
import type { ApiError } from '../../../types/api'
import type { LoginPayload } from '../../../services/auth'

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

interface LoginFormProps {
  onSubmit: (data: LoginPayload) => void
  isPending: boolean
  error: ApiError | null
  isMobile: boolean
}

export function LoginForm({ onSubmit, isPending, error, isMobile }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<LoginPayload>({
    defaultValues: {
      username: 'admin',
      password: 'admin1234',
    },
  })

  useEffect(() => {
    if (error?.details) {
      Object.entries(error.details).forEach(([field, messages]) => {
        if (field === 'username' || field === 'password') {
          setError(field, { message: messages[0] })
        }
      })
    }
  }, [error, setError])

  const nonFieldError = error && !error.details ? error.message : null

  return (
    <Box
      style={{
        width: isMobile ? '100%' : '55%',
        backgroundColor: 'white',
        padding: isMobile ? 24 : 40,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        borderRadius: isMobile ? 'var(--mantine-radius-lg)' : undefined,
        boxShadow: isMobile ? 'var(--mantine-shadow-md)' : undefined,
      }}
    >
      <Stack gap="lg">
        <Box>
          <Text fw={700} fz={24}>
            Sign In
          </Text>
          <Text fz="sm" c="dimmed">
            Welcome back! Please enter your details.
          </Text>
        </Box>

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

        {nonFieldError && (
          <Alert color="red" icon={<IconAlertCircle size={16} />} variant="light">
            {nonFieldError}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Username"
              placeholder="your username"
              leftSection={<IconMail size={16} />}
              radius="md"
              error={errors.username?.message}
              {...register('username', { required: 'Username is required.' })}
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
              variant="gradient"
              loading={isPending}
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
  )
}
