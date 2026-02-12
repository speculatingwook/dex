import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { AppSettings } from '../../../preload/index.d'

interface SettingsContextValue {
  settings: AppSettings | null
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void
  monospaceFonts: string[]
}

const DEFAULT_SETTINGS: AppSettings = {
  themeMode: 'system',
  fontFamily: 'Menlo, Monaco, "Courier New", monospace',
  fontSize: 14,
  terminalScrollback: 5000,
  showHiddenFiles: false,
  wordWrap: false,
  windowBounds: { width: 1400, height: 900, x: undefined, y: undefined },
  splitPosition: null,
  fileTreeCollapsed: false,
  leftPanelCollapsed: false
}

export const SettingsContext = createContext<SettingsContextValue>({
  settings: null,
  updateSetting: () => {},
  monospaceFonts: []
})

export function useSettings(): SettingsContextValue {
  return useContext(SettingsContext)
}

export function useSettingsProvider(): SettingsContextValue {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [monospaceFonts, setMonospaceFonts] = useState<string[]>([])

  useEffect(() => {
    window.api.getSettings().then(setSettings)
    window.api.getMonospaceFonts().then(setMonospaceFonts)

    const cleanup = window.api.onSettingsChanged((newSettings) => {
      setSettings(newSettings)
    })
    return cleanup
  }, [])

  const updateSetting = useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      setSettings((prev) => (prev ? { ...prev, [key]: value } : null))
      window.api.setSetting(key, value)
    },
    []
  )

  return {
    settings: settings ?? DEFAULT_SETTINGS,
    updateSetting,
    monospaceFonts
  }
}
