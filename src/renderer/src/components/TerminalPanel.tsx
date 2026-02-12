import { useRef } from 'react'
import { useTerminal } from '../hooks/useTerminal'
import { useTheme } from '../hooks/useTheme'
import { useSettings } from '../hooks/useSettings'

export default function TerminalPanel(): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()
  const { settings } = useSettings()

  useTerminal(containerRef, resolvedTheme, {
    fontFamily: settings?.fontFamily ?? 'Menlo, Monaco, "Courier New", monospace',
    fontSize: settings?.fontSize ?? 14,
    scrollback: settings?.terminalScrollback ?? 5000
  })

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'var(--terminal-bg)',
        padding: '8px 0 0 8px',
        boxSizing: 'border-box'
      }}
    >
      <div
        ref={containerRef}
        onClick={() => containerRef.current?.querySelector('textarea')?.focus()}
        style={{
          width: '100%',
          height: '100%'
        }}
      />
    </div>
  )
}
