import { useTheme } from '../hooks/useTheme'

interface ToolbarProps {
  onOpenSettings: () => void
}

export default function Toolbar({ onOpenSettings }: ToolbarProps): React.JSX.Element {
  const { resolvedTheme, themeMode, setThemeMode } = useTheme()

  const cycleTheme = (): void => {
    const order: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system']
    const idx = order.indexOf(themeMode)
    setThemeMode(order[(idx + 1) % order.length])
  }

  const themeIcon = themeMode === 'system' ? '◐' : resolvedTheme === 'dark' ? '☀' : '☾'

  const buttonStyle: React.CSSProperties = {
    width: 28,
    height: 28,
    border: '1px solid var(--border-button)',
    borderRadius: 8,
    background: 'var(--bg-button)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    padding: 0,
    transition: 'background 0.15s, color 0.15s, border-color 0.15s'
  }

  const handleEnter = (e: React.MouseEvent<HTMLButtonElement>): void => {
    const btn = e.currentTarget
    btn.style.background = 'var(--accent)'
    btn.style.color = '#fff'
    btn.style.borderColor = 'var(--accent)'
  }

  const handleLeave = (e: React.MouseEvent<HTMLButtonElement>): void => {
    const btn = e.currentTarget
    btn.style.background = 'var(--bg-button)'
    btn.style.color = 'var(--text-secondary)'
    btn.style.borderColor = 'var(--border-button)'
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 8,
        right: 12,
        zIndex: 100,
        display: 'flex',
        gap: 6,
        ...({ WebkitAppRegion: 'no-drag' } as React.CSSProperties)
      }}
    >
      <button
        onClick={cycleTheme}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        style={buttonStyle}
        aria-label={`Theme: ${themeMode}`}
        title={`Theme: ${themeMode}`}
      >
        {themeIcon}
      </button>
      <button
        onClick={onOpenSettings}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        style={buttonStyle}
        aria-label="Settings"
        title="Settings"
      >
        ⚙
      </button>
    </div>
  )
}
