import type { FileEntry } from '../../../preload/index.d'

interface FileTreeItemProps {
  entry: FileEntry
  depth: number
  entries: Map<string, FileEntry[]>
  expandedDirs: Set<string>
  selectedFile: string | null
  onToggleDir: (path: string) => void
  onSelectFile: (path: string) => void
}

const FILE_ICONS: Record<string, string> = {
  '.ts': '📘',
  '.tsx': '⚛️',
  '.js': '📒',
  '.jsx': '⚛️',
  '.json': '📋',
  '.md': '📝',
  '.mdx': '📝',
  '.css': '🎨',
  '.html': '🌐',
  '.py': '🐍',
  '.rs': '🦀',
  '.go': '🔷',
  '.yaml': '⚙️',
  '.yml': '⚙️',
  '.toml': '⚙️',
  '.svg': '🖼️',
  '.png': '🖼️',
  '.jpg': '🖼️'
}

function getFileIcon(name: string): string {
  const ext = '.' + name.split('.').pop()?.toLowerCase()
  return FILE_ICONS[ext] || '📄'
}

export default function FileTreeItem({
  entry,
  depth,
  entries,
  expandedDirs,
  selectedFile,
  onToggleDir,
  onSelectFile
}: FileTreeItemProps): React.JSX.Element {
  const isExpanded = expandedDirs.has(entry.path)
  const isSelected = selectedFile === entry.path
  const children = entries.get(entry.path) || []

  const handleClick = (): void => {
    if (entry.isDirectory) {
      onToggleDir(entry.path)
    } else {
      onSelectFile(entry.path)
    }
  }

  return (
    <div>
      <div
        onClick={handleClick}
        style={{
          paddingLeft: depth * 16 + 8,
          paddingRight: 8,
          paddingTop: 3,
          paddingBottom: 3,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 13,
          lineHeight: '20px',
          background: isSelected ? 'var(--bg-selected)' : 'transparent',
          color: isSelected ? 'var(--text-heading)' : 'var(--text-secondary)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
        onMouseEnter={(e) => {
          if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)'
        }}
        onMouseLeave={(e) => {
          if (!isSelected) e.currentTarget.style.background = 'transparent'
        }}
      >
        {entry.isDirectory && (
          <span style={{ fontSize: 10, width: 12, textAlign: 'center', flexShrink: 0 }}>
            {isExpanded ? '▼' : '▶'}
          </span>
        )}
        {!entry.isDirectory && <span style={{ width: 12, flexShrink: 0 }} />}
        <span style={{ flexShrink: 0 }}>
          {entry.isDirectory ? (isExpanded ? '📂' : '📁') : getFileIcon(entry.name)}
        </span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.name}</span>
      </div>

      {entry.isDirectory && isExpanded && (
        <div>
          {children.map((child) => (
            <FileTreeItem
              key={child.path}
              entry={child}
              depth={depth + 1}
              entries={entries}
              expandedDirs={expandedDirs}
              selectedFile={selectedFile}
              onToggleDir={onToggleDir}
              onSelectFile={onSelectFile}
            />
          ))}
        </div>
      )}
    </div>
  )
}
