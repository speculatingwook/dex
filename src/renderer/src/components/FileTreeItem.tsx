import { useState, useRef, useEffect } from 'react'
import type { FileEntry } from '../../../preload/index.d'

interface FileTreeItemProps {
  entry: FileEntry
  depth: number
  entries: Map<string, FileEntry[]>
  expandedDirs: Set<string>
  selectedFile: string | null
  onToggleDir: (path: string) => void
  onSelectFile: (path: string) => void
  onContextMenu: (e: React.MouseEvent, entry: FileEntry) => void
  renamingPath: string | null
  onRenameSubmit: (oldPath: string, newName: string) => void
  onRenameCancel: () => void
  creatingIn: { dirPath: string; type: 'file' | 'dir' } | null
  onCreateSubmit: (parentDir: string, name: string, type: 'file' | 'dir') => void
  onCreateCancel: () => void
  onMovePath: (sourcePath: string, targetDir: string) => void
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

export function InlineInput({
  defaultValue,
  onSubmit,
  onCancel,
  depth,
  icon
}: {
  defaultValue: string
  onSubmit: (value: string) => void
  onCancel: () => void
  depth: number
  icon: string
}): React.JSX.Element {
  const [value, setValue] = useState(defaultValue)
  const inputRef = useRef<HTMLInputElement>(null)
  const submittedRef = useRef(false)

  useEffect(() => {
    const input = inputRef.current
    if (!input) return
    input.focus()
    if (defaultValue) {
      const dotIdx = defaultValue.lastIndexOf('.')
      if (dotIdx > 0) {
        input.setSelectionRange(0, dotIdx)
      } else {
        input.select()
      }
    }
  }, [defaultValue])

  const handleSubmit = (): void => {
    if (submittedRef.current) return
    submittedRef.current = true
    const trimmed = value.trim()
    if (trimmed && trimmed !== defaultValue) {
      onSubmit(trimmed)
    } else {
      onCancel()
    }
  }

  return (
    <div
      style={{
        paddingLeft: depth * 16 + 8,
        paddingRight: 8,
        paddingTop: 2,
        paddingBottom: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 4
      }}
    >
      <span style={{ width: 12, flexShrink: 0 }} />
      <span style={{ flexShrink: 0 }}>{icon}</span>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit()
          if (e.key === 'Escape') onCancel()
        }}
        onBlur={handleSubmit}
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 13,
          lineHeight: '20px',
          padding: '0 4px',
          border: '1px solid var(--accent)',
          borderRadius: 3,
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          outline: 'none',
          fontFamily: 'inherit'
        }}
      />
    </div>
  )
}

export default function FileTreeItem({
  entry,
  depth,
  entries,
  expandedDirs,
  selectedFile,
  onToggleDir,
  onSelectFile,
  onContextMenu,
  renamingPath,
  onRenameSubmit,
  onRenameCancel,
  creatingIn,
  onCreateSubmit,
  onCreateCancel,
  onMovePath
}: FileTreeItemProps): React.JSX.Element {
  const isExpanded = expandedDirs.has(entry.path)
  const isSelected = selectedFile === entry.path
  const children = entries.get(entry.path) || []
  const isRenaming = renamingPath === entry.path
  const isCreatingHere = creatingIn?.dirPath === entry.path
  const [dropHighlight, setDropHighlight] = useState(false)


  const handleClick = (): void => {
    if (isRenaming) return
    if (entry.isDirectory) {
      onToggleDir(entry.path)
    } else {
      onSelectFile(entry.path)
    }
  }

  const handleContextMenu = (e: React.MouseEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    onContextMenu(e, entry)
  }

  const entryIcon = entry.isDirectory ? (isExpanded ? '📂' : '📁') : getFileIcon(entry.name)

  const childProps = {
    entries,
    expandedDirs,
    selectedFile,
    onToggleDir,
    onSelectFile,
    onContextMenu,
    renamingPath,
    onRenameSubmit,
    onRenameCancel,
    creatingIn,
    onCreateSubmit,
    onCreateCancel,
    onMovePath
  }

  const renderChildren = (): React.JSX.Element | null => {
    if (!entry.isDirectory || !isExpanded) return null
    return (
      <div>
        {isCreatingHere && (
          <InlineInput
            defaultValue=""
            onSubmit={(name) => onCreateSubmit(entry.path, name, creatingIn!.type)}
            onCancel={onCreateCancel}
            depth={depth + 1}
            icon={creatingIn!.type === 'dir' ? '📁' : '📄'}
          />
        )}
        {children.map((child) => (
          <FileTreeItem key={child.path} entry={child} depth={depth + 1} {...childProps} />
        ))}
      </div>
    )
  }

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>): void => {
    if (isRenaming) {
      e.preventDefault()
      return
    }
    e.dataTransfer.setData('text/plain', entry.path)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    if (!entry.isDirectory) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropHighlight(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>): void => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setDropHighlight(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault()
    e.stopPropagation()
    setDropHighlight(false)
    if (!entry.isDirectory) return
    const sourcePath = e.dataTransfer.getData('text/plain')
    if (!sourcePath) return
    if (sourcePath === entry.path) return
    const sourceParent = sourcePath.split('/').slice(0, -1).join('/')
    if (sourceParent === entry.path) return
    if (entry.path.startsWith(sourcePath + '/')) return
    onMovePath(sourcePath, entry.path)
  }

  if (isRenaming) {
    return (
      <div>
        <InlineInput
          defaultValue={entry.name}
          onSubmit={(newName) => onRenameSubmit(entry.path, newName)}
          onCancel={onRenameCancel}
          depth={depth}
          icon={entryIcon}
        />
        {renderChildren()}
      </div>
    )
  }

  return (
    <div>
      <div
        draggable={!isRenaming}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
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
          background: dropHighlight
            ? 'var(--bg-hover)'
            : isSelected
              ? 'var(--bg-selected)'
              : 'transparent',
          color: isSelected ? 'var(--text-heading)' : 'var(--text-secondary)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          outline: dropHighlight ? '1px solid var(--accent)' : 'none',
          outlineOffset: -1
        }}
        onMouseEnter={(e) => {
          if (!isSelected && !dropHighlight) e.currentTarget.style.background = 'var(--bg-hover)'
        }}
        onMouseLeave={(e) => {
          if (!isSelected && !dropHighlight) e.currentTarget.style.background = 'transparent'
        }}
      >
        {entry.isDirectory && (
          <span style={{ fontSize: 10, width: 12, textAlign: 'center', flexShrink: 0 }}>
            {isExpanded ? '▼' : '▶'}
          </span>
        )}
        {!entry.isDirectory && <span style={{ width: 12, flexShrink: 0 }} />}
        <span style={{ flexShrink: 0 }}>{entryIcon}</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.name}</span>
      </div>
      {renderChildren()}
    </div>
  )
}
