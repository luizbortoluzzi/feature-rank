import { renderHook } from '@testing-library/react'
import { useIsMobile, SM_BREAKPOINT, MD_BREAKPOINT } from './use-is-mobile'

describe('useIsMobile', () => {
  it('exports SM_BREAKPOINT as the sm media query string', () => {
    expect(SM_BREAKPOINT).toBe('(max-width: 48em)')
  })

  it('exports MD_BREAKPOINT as the md media query string', () => {
    expect(MD_BREAKPOINT).toBe('(max-width: 62em)')
  })

  it('returns false when matchMedia does not match (default jsdom mock)', () => {
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('returns true when matchMedia reports a match', () => {
    window.matchMedia = (query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)

    // Restore default mock
    window.matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })
  })
})
