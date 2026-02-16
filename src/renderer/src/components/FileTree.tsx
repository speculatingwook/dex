import { useState } from 'react'
import { useFileTree } from '../hooks/useFileTree'
import FileTreeItem from './FileTreeItem'

interface FileTreeProps {
  onSelectFile: (path: string) => void
}

const EXPANDED_WIDTH = 220
const COLLAPSED_WIDTH = 36

export default function FileTree({ onSelectFile }: FileTreeProps): React.JSX.Element {
  const { rootDir, entries, expandedDirs, toggleDir, selectedFile, selectFile } =
    useFileTree(onSelectFile)
  const [collapsed, setCollapsed] = useState(false)

  const rootEntries = entries.get(rootDir) || []
  const dirName = rootDir.split('/').pop() || rootDir

  return (
    <div
      style={{
        width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
        flexShrink: 0,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        transition: 'width 0.15s ease'
      }}
    >
      <div
        style={{
          padding: collapsed ? '12px 0 8px' : '12px 12px 8px',
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--text-muted)',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: 4
        }}
      >
        {!collapsed && (
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {dirName}
          </span>
        )}
        <button
          onClick={() => setCollapsed((p) => !p)}
          style={{
            width: 20,
            height: 20,
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
            flexShrink: 0,
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
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {!collapsed && (
        <div style={{ flex: 1, overflowY: 'auto', paddingTop: 4, paddingBottom: 4 }}>
          {rootEntries.map((entry) => (
            <FileTreeItem
              key={entry.path}
              entry={entry}
              depth={0}
              entries={entries}
              expandedDirs={expandedDirs}
              selectedFile={selectedFile}
              onToggleDir={toggleDir}
              onSelectFile={selectFile}
            />
          ))}
        </div>
      )}
    </div>
  )
}
