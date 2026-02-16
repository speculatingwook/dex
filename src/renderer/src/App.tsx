import { useState, useCallback, useEffect } from 'react'
import SplitPanel from './components/SplitPanel'
import FileTree from './components/FileTree'
import DocumentViewer from './components/DocumentViewer'
import TerminalPanel from './components/TerminalPanel'
import Toolbar from './components/ThemeToggle'
import ErrorBoundary from './components/ErrorBoundary'
import { ThemeContext, useThemeProvider } from './hooks/useTheme'
import { SettingsContext, useSettingsProvider } from './hooks/useSettings'
import type { ThemeMode } from './hooks/useTheme'

function AppInner(): React.JSX.Element {
  const TITLEBAR_HEIGHT = 40
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [SettingsModal, setSettingsModal] = useState<React.ComponentType<{
    isOpen: boolean
    onClose: () => void
  }> | null>(null)

  useEffect(() => {
    import('./components/SettingsModal').then((mod) => {
      setSettingsModal(() => mod.default)
    })
  }, [])

  useEffect(() => {
    const cleanupOpenSettings = window.api.onMenuOpenSettings(() => {
      setSettingsOpen(true)
    })
    const cleanupToggleSidebar = window.api.onMenuToggleSidebar(() => {
      setLeftCollapsed((p) => !p)
    })

    return () => {
      cleanupOpenSettings()
      cleanupToggleSidebar()
    }
  }, [])

  const handleFileSelect = useCallback((path: string) => {
    setSelectedFile(path)
  }, [])

  const toggleCollapse = useCallback(() => {
    setLeftCollapsed((prev) => !prev)
  }, [])

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          height: TITLEBAR_HEIGHT,
          minHeight: TITLEBAR_HEIGHT,
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 80,
          fontSize: 12,
          color: 'var(--text-muted)',
          ...({ WebkitAppRegion: 'drag' } as React.CSSProperties)
        }}
      >
        dex
      </div>
      <Toolbar onOpenSettings={() => setSettingsOpen(true)} />
      <div style={{ flex: 1, minHeight: 0 }}>
        <SplitPanel
          leftCollapsed={leftCollapsed}
          onToggleCollapse={toggleCollapse}
          left={
            <div style={{ display: 'flex', width: '100%', height: '100%' }}>
              <FileTree onSelectFile={handleFileSelect} />
              <DocumentViewer filePath={selectedFile} />
            </div>
          }
          right={<TerminalPanel />}
        />
      </div>
      {SettingsModal && (
        <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  )
}

function App(): React.JSX.Element {
  const settingsValue = useSettingsProvider()
  const handleThemeModeChange = useCallback(
    (mode: ThemeMode) => {
      settingsValue.updateSetting('themeMode', mode)
    },
    [settingsValue]
  )
  const themeValue = useThemeProvider(
    (settingsValue.settings?.themeMode as ThemeMode) ?? 'system',
    handleThemeModeChange
  )

  return (
    <ErrorBoundary>
      <SettingsContext.Provider value={settingsValue}>
        <ThemeContext.Provider value={themeValue}>
          <AppInner />
        </ThemeContext.Provider>
      </SettingsContext.Provider>
    </ErrorBoundary>
  )
}

export default App
