import React, { useEffect, useRef } from 'react'
import { useSettings } from '../hooks/useSettings'
import { useTheme } from '../hooks/useTheme'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps): React.JSX.Element | null {
  const { settings, updateSetting, monospaceFonts } = useSettings()
  const { themeMode, setThemeMode } = useTheme()
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !settings) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose()
    }
  }

  const styles = {
    overlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      animation: 'fadeIn 0.2s ease-out',
    },
    modal: {
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: '12px',
      boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
      width: '100%',
      maxWidth: '500px',
      maxHeight: '85vh',
      display: 'flex',
      flexDirection: 'column' as const,
      border: '1px solid var(--border)',
      color: 'var(--text-primary)',
      animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      overflow: 'hidden',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 24px',
      borderBottom: '1px solid var(--divider)',
    },
    title: {
      fontSize: '18px',
      fontWeight: 600,
      margin: 0,
      color: 'var(--text-heading)',
    },
    closeButton: {
      background: 'transparent',
      border: 'none',
      color: 'var(--text-muted)',
      cursor: 'pointer',
      padding: '4px',
      fontSize: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '4px',
      transition: 'all 0.2s',
    },
    content: {
      padding: '24px',
      overflowY: 'auto' as const,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '32px',
    },
    section: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '16px',
    },
    sectionTitle: {
      fontSize: '13px',
      fontWeight: 600,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      color: 'var(--text-muted)',
      marginBottom: '8px',
    },
    row: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
    },
    label: {
      fontSize: '14px',
      color: 'var(--text-secondary)',
      flex: 1,
    },
    control: {
      flex: 1,
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    select: {
      appearance: 'none' as const,
      backgroundColor: 'var(--bg-tertiary)',
      border: '1px solid var(--border-button)',
      color: 'var(--text-primary)',
      padding: '8px 12px',
      borderRadius: '6px',
      fontSize: '14px',
      width: '100%',
      outline: 'none',
      cursor: 'pointer',
      backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236c7086%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 12px center',
      backgroundSize: '8px',
      paddingRight: '30px',
    },
    rangeContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      width: '100%',
    },
    range: {
      flex: 1,
      height: '4px',
      borderRadius: '2px',
      backgroundColor: 'var(--bg-tertiary)',
      outline: 'none',
      cursor: 'pointer',
      accentColor: 'var(--accent)',
    },
    value: {
      fontSize: '13px',
      color: 'var(--text-dim)',
      minWidth: '40px',
      textAlign: 'right' as const,
      fontVariantNumeric: 'tabular-nums',
    },
    toggle: {
      position: 'relative' as const,
      width: '44px',
      height: '24px',
      borderRadius: '12px',
      backgroundColor: 'var(--bg-tertiary)',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      border: '1px solid var(--border-button)',
    },
    toggleActive: {
      backgroundColor: 'var(--accent)',
      borderColor: 'var(--accent)',
    },
    toggleKnob: {
      position: 'absolute' as const,
      top: '2px',
      left: '2px',
      width: '18px',
      height: '18px',
      borderRadius: '50%',
      backgroundColor: '#fff',
      transition: 'transform 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
      boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
    },
    toggleKnobActive: {
      transform: 'translateX(20px)',
    },
    segmentedControl: {
      display: 'flex',
      backgroundColor: 'var(--bg-tertiary)',
      borderRadius: '8px',
      padding: '4px',
      gap: '4px',
      width: '100%',
    },
    segmentButton: {
      flex: 1,
      background: 'transparent',
      border: 'none',
      padding: '6px 12px',
      borderRadius: '6px',
      fontSize: '13px',
      fontWeight: 500,
      color: 'var(--text-muted)',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
    },
    segmentButtonActive: {
      backgroundColor: 'var(--bg-button)',
      color: 'var(--text-heading)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
  }

  
  return (
    <div style={styles.overlay} onClick={handleBackdropClick} aria-modal="true" role="dialog" aria-label="Settings">
      <div ref={modalRef} style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Settings</h2>
          <button 
            style={styles.closeButton} 
            onClick={onClose}
            aria-label="Close settings"
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-heading)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            ×
          </button>
        </div>

        <div style={styles.content}>
          
          <div style={styles.section}>
            <div style={styles.sectionTitle}>Appearance</div>
            <div style={styles.segmentedControl}>
              {(['light', 'dark', 'system'] as const).map((mode) => {
                const isActive = themeMode === mode
                const labels = { light: '☀ Light', dark: '☾ Dark', system: '💻 System' }
                
                return (
                  <button
                    key={mode}
                    onClick={() => setThemeMode(mode)}
                    style={{
                      ...styles.segmentButton,
                      ...(isActive ? styles.segmentButtonActive : {}),
                    }}
                  >
                    {labels[mode]}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={styles.section}>
            <div style={styles.sectionTitle}>Font</div>
            
            <div style={styles.row}>
              <label style={styles.label}>Family</label>
              <div style={{ flex: 2 }}>
                <select
                  value={settings.fontFamily}
                  onChange={(e) => updateSetting('fontFamily', e.target.value)}
                  style={{...styles.select, fontFamily: settings.fontFamily}}
                >
                  {monospaceFonts.map((font) => (
                    <option key={font} value={font} style={{ fontFamily: font }}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={styles.row}>
              <label style={styles.label}>Size</label>
              <div style={styles.control}>
                <div style={styles.rangeContainer}>
                  <input
                    type="range"
                    min="8"
                    max="32"
                    step="1"
                    value={settings.fontSize}
                    onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
                    style={styles.range}
                  />
                  <span style={styles.value}>{settings.fontSize}px</span>
                </div>
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <div style={styles.sectionTitle}>Editor</div>
            <div style={styles.row}>
              <label style={styles.label}>Word Wrap</label>
              <div 
                style={{
                  ...styles.toggle,
                  ...(settings.wordWrap ? styles.toggleActive : {})
                }}
                onClick={() => updateSetting('wordWrap', !settings.wordWrap)}
                role="checkbox"
                aria-checked={settings.wordWrap}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    updateSetting('wordWrap', !settings.wordWrap)
                  }
                }}
              >
                <div style={{
                  ...styles.toggleKnob,
                  ...(settings.wordWrap ? styles.toggleKnobActive : {})
                }} />
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <div style={styles.sectionTitle}>Terminal</div>
            <div style={styles.row}>
              <label style={styles.label}>Scrollback Buffer</label>
              <div style={{ flex: 2 }}>
                <div style={styles.rangeContainer}>
                  <input
                    type="range"
                    min="1000"
                    max="50000"
                    step="1000"
                    value={settings.terminalScrollback}
                    onChange={(e) => updateSetting('terminalScrollback', parseInt(e.target.value))}
                    style={styles.range}
                  />
                  <span style={{...styles.value, minWidth: '60px'}}>{settings.terminalScrollback}</span>
                </div>
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <div style={styles.sectionTitle}>File Tree</div>
            <div style={styles.row}>
              <label style={styles.label}>Show Hidden Files</label>
              <div 
                style={{
                  ...styles.toggle,
                  ...(settings.showHiddenFiles ? styles.toggleActive : {})
                }}
                onClick={() => updateSetting('showHiddenFiles', !settings.showHiddenFiles)}
                role="checkbox"
                aria-checked={settings.showHiddenFiles}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    updateSetting('showHiddenFiles', !settings.showHiddenFiles)
                  }
                }}
              >
                <div style={{
                  ...styles.toggleKnob,
                  ...(settings.showHiddenFiles ? styles.toggleKnobActive : {})
                }} />
              </div>
            </div>
          </div>

        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
