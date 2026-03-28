import { createElement } from 'react'
import { notifications } from '@mantine/notifications'
import {
  IconAlertCircleFilled,
  IconAlertTriangleFilled,
  IconCircleCheckFilled,
  IconInfoCircleFilled,
} from '@tabler/icons-react'
import type { ApiError } from '../types/api'

export function useNotify() {
  function success(title: string, message?: string) {
    notifications.show({
      title,
      message,
      color: 'green',
      icon: createElement(IconCircleCheckFilled, { size: 20 }),
      autoClose: 3000,
    })
  }

  function error(title: string, apiError?: ApiError | null) {
    notifications.show({
      title,
      message: apiError?.message ?? 'Something went wrong. Please try again.',
      color: 'red',
      icon: createElement(IconAlertCircleFilled, { size: 20 }),
      autoClose: 5000,
    })
  }

  function info(title: string, message?: string) {
    notifications.show({
      title,
      message,
      color: 'indigo',
      icon: createElement(IconInfoCircleFilled, { size: 20 }),
      autoClose: 4000,
    })
  }

  function warning(title: string, message?: string) {
    notifications.show({
      title,
      message,
      color: 'yellow',
      icon: createElement(IconAlertTriangleFilled, { size: 20 }),
      autoClose: 5000,
    })
  }

  return { success, error, info, warning }
}
