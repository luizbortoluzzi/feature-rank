import { useMediaQuery } from '@mantine/hooks'

export const SM_BREAKPOINT = '(max-width: 48em)'

export function useIsMobile(): boolean {
  return useMediaQuery(SM_BREAKPOINT) ?? false
}
