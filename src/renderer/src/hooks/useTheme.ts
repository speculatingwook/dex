import { createContext, useContext, useState, useCallback, useEffect } from 'react'

export type ResolvedTheme = 'dark' | 'light'
export type ThemeMode = 'dark' | 'light' | 'system'

interface ThemeContextValue {
  resolvedTheme: ResolvedTheme
  themeMode: ThemeMode
  setThemeMode: (mode: ThemeMode) => void
}

export const ThemeContext = createContext<ThemeContextValue>({
  resolvedTheme: 'dark',
  themeMode: 'system',
  setThemeMode: () => {}
})

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}

export function useThemeProvider(
  settingsThemeMode: ThemeMode,
  onThemeModeChange: (mode: ThemeMode) => void
): ThemeContextValue {
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark')

  useEffect(() => {
    window.api.getResolvedTheme().then(setResolvedTheme)

    const cleanup = window.api.onThemeUpdated((theme) => {
      setResolvedTheme(theme)
    })
    return cleanup
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme)
  }, [resolvedTheme])

  const setThemeMode = useCallback(
    (mode: ThemeMode) => {
      onThemeModeChange(mode)

      if (mode === 'system') {
        window.api.getResolvedTheme().then(setResolvedTheme)
      } else {
        setResolvedTheme(mode)
      }
    },
    [onThemeModeChange]
  )

  return { resolvedTheme, themeMode: settingsThemeMode, setThemeMode }
}
