import { useState, useCallback, useEffect, useRef, type ReactNode } from 'react'

interface SplitPanelProps {
  left: ReactNode
  right: ReactNode
  leftCollapsed: boolean
  onToggleCollapse: () => void
  minLeftWidth?: number
  minRightWidth?: number
}

export default function SplitPanel({
  left,
  right,
  leftCollapsed,
  onToggleCollapse,
  minLeftWidth = 200,
  minRightWidth = 300
}: SplitPanelProps): React.JSX.Element {
  const [leftWidth, setLeftWidth] = useState<number | null>(null)
  const isDragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const widthBeforeCollapse = useRef<number>(0)

  useEffect(() => {
    if (containerRef.current && leftWidth === null) {
      setLeftWidth(Math.floor(containerRef.current.getBoundingClientRect().width / 2))
    }
  }, [leftWidth])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (leftCollapsed) return
      e.preventDefault()
      isDragging.current = true
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    },
    [leftCollapsed]
  )

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent): void => {
      if (!isDragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const newWidth = e.clientX - rect.left
      const maxWidth = rect.width - minRightWidth
      setLeftWidth(Math.min(Math.max(newWidth, minLeftWidth), maxWidth))
    }

    const handleMouseUp = (): void => {
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [minLeftWidth, minRightWidth])

  useEffect(() => {
    if (leftCollapsed && leftWidth) {
      widthBeforeCollapse.current = leftWidth
    }
    if (!leftCollapsed && widthBeforeCollapse.current > 0) {
      setLeftWidth(widthBeforeCollapse.current)
    }
  }, [leftCollapsed])

  const resolvedLeftWidth = leftCollapsed ? 0 : (leftWidth ?? 600)

  return (
    <div ref={containerRef} style={{ display: 'flex', height: '100%', width: '100%' }}>
      <div
        style={{
          width: resolvedLeftWidth,
          flexShrink: 0,
          overflow: 'hidden',
          display: 'flex',
          transition: isDragging.current ? 'none' : 'width 0.2s ease'
        }}
      >
        {left}
      </div>
      <div
        style={{
          width: 4,
          flexShrink: 0,
          cursor: 'col-resize',
          background: 'var(--divider)',
          transition: 'background 0.15s',
          position: 'relative'
        }}
        onMouseDown={handleMouseDown}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLDivElement).style.background = 'var(--accent)'
        }}
        onMouseLeave={(e) => {
          if (!isDragging.current) {
            ;(e.currentTarget as HTMLDivElement).style.background = 'var(--divider)'
          }
        }}
      >
        <button
          onClick={onToggleCollapse}
          style={{
            position: 'absolute',
            top: 36,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 20,
            height: 28,
            border: '1px solid var(--border-button)',
            borderRadius: 6,
            background: 'var(--bg-button)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            padding: 0,
            zIndex: 10,
            transition: 'background 0.15s, color 0.15s, border-color 0.15s'
          }}
          onMouseEnter={(e) => {
            const btn = e.currentTarget
            btn.style.background = 'var(--accent)'
            btn.style.color = '#fff'
            btn.style.borderColor = 'var(--accent)'
          }}
          onMouseLeave={(e) => {
            const btn = e.currentTarget
            btn.style.background = 'var(--bg-button)'
            btn.style.color = 'var(--text-secondary)'
            btn.style.borderColor = 'var(--border-button)'
          }}
        >
          {leftCollapsed ? '›' : '‹'}
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {right}
      </div>
    </div>
  )
}
