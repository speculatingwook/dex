import { useState, useEffect, useCallback } from 'react'
import { useFileTree } from '../hooks/useFileTree'
import FileTreeItem, { InlineInput } from './FileTreeItem'
import type { FileEntry } from '../../../preload/index.d'

export const FILETREE_EXPANDED_WIDTH = 220
export const FILETREE_COLLAPSED_WIDTH = 36

interface FileTreeProps {
  onSelectFile: (path: string | null) => void
  collapsed: boolean
  onCollapseChange: (collapsed: boolean) => void
}

function ActionButton({
  title,
  onClick,
  children
}: {
  title: string
  onClick: () => void
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <button
      title={title}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
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
        fontSize: 13,
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
      {children}
    </button>
  )
}

function ContextMenu({
  x,
  y,
  entry,
  onNewFile,
  onNewFolder,
  onRename,
  onDelete
}: {
  x: number
  y: number
  entry: FileEntry
  onNewFile: (dirPath: string) => void
  onNewFolder: (dirPath: string) => void
  onRename: (path: string) => void
  onDelete: (entry: FileEntry) => void
}): React.JSX.Element {
  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: x,
    top: y,
    zIndex: 1000,
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    padding: '4px 0',
    minWidth: 150,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
  }

  const itemStyle: React.CSSProperties = {
    padding: '5px 12px',
    fontSize: 13,
    cursor: 'pointer',
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap'
  }

  const deleteStyle: React.CSSProperties = {
    ...itemStyle,
    color: 'var(--text-error)'
  }

  const handleHover = (e: React.MouseEvent, enter: boolean): void => {
    ;(e.currentTarget as HTMLDivElement).style.background = enter
      ? 'var(--bg-hover)'
      : 'transparent'
  }

  return (
    <div style={menuStyle} onClick={(e) => e.stopPropagation()}>
      {entry.isDirectory && (
        <>
          <div
            style={itemStyle}
            onClick={() => onNewFile(entry.path)}
            onMouseEnter={(e) => handleHover(e, true)}
            onMouseLeave={(e) => handleHover(e, false)}
          >
            New File
          </div>
          <div
            style={itemStyle}
            onClick={() => onNewFolder(entry.path)}
            onMouseEnter={(e) => handleHover(e, true)}
            onMouseLeave={(e) => handleHover(e, false)}
          >
            New Folder
          </div>
          <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
        </>
      )}
      <div
        style={itemStyle}
        onClick={() => onRename(entry.path)}
        onMouseEnter={(e) => handleHover(e, true)}
        onMouseLeave={(e) => handleHover(e, false)}
      >
        Rename
      </div>
      <div
        style={deleteStyle}
        onClick={() => onDelete(entry)}
        onMouseEnter={(e) => handleHover(e, true)}
        onMouseLeave={(e) => handleHover(e, false)}
      >
        Delete
      </div>
    </div>
  )
}

export default function FileTree({
  onSelectFile,
  collapsed,
  onCollapseChange
}: FileTreeProps): React.JSX.Element {
  const {
    rootDir,
    entries,
    expandedDirs,
    toggleDir,
    selectedFile,
    selectFile,
    createFile,
    createDir,
    deletePath,
    renamePath,
    movePath
  } = useFileTree(onSelectFile)

  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    entry: FileEntry
  } | null>(null)

  const [creatingIn, setCreatingIn] = useState<{
    dirPath: string
    type: 'file' | 'dir'
  } | null>(null)

  const [renamingPath, setRenamingPath] = useState<string | null>(null)

  useEffect(() => {
    if (!contextMenu) return
    const handleClick = (): void => setContextMenu(null)
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [contextMenu])

  const handleContextMenu = useCallback((e: React.MouseEvent, entry: FileEntry) => {
    setContextMenu({ x: e.clientX, y: e.clientY, entry })
  }, [])

  const handleCreateSubmit = useCallback(
    async (parentDir: string, name: string, type: 'file' | 'dir') => {
      if (type === 'file') {
        await createFile(parentDir, name)
      } else {
        await createDir(parentDir, name)
      }
      setCreatingIn(null)
    },
    [createFile, createDir]
  )

  const handleRenameSubmit = useCallback(
    async (oldPath: string, newName: string) => {
      await renamePath(oldPath, newName)
      setRenamingPath(null)
    },
    [renamePath]
  )

  const handleDelete = useCallback(
    async (entry: FileEntry) => {
      const confirmed = window.confirm(
        `Delete "${entry.name}"${entry.isDirectory ? ' and all its contents' : ''}?`
      )
      if (confirmed) {
        await deletePath(entry.path)
      }
    },
    [deletePath]
  )

  const startCreate = useCallback(
    (dirPath: string, type: 'file' | 'dir') => {
      if (!expandedDirs.has(dirPath)) {
        toggleDir(dirPath)
      }
      setCreatingIn({ dirPath, type })
      setContextMenu(null)
    },
    [expandedDirs, toggleDir]
  )

  const rootEntries = entries.get(rootDir) || []
  const dirName = rootDir.split('/').pop() || rootDir
  const isCreatingInRoot = creatingIn?.dirPath === rootDir

  return (
    <div
      style={{
        width: collapsed ? FILETREE_COLLAPSED_WIDTH : FILETREE_EXPANDED_WIDTH,
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
          padding: collapsed ? '12px 0 8px' : '12px 8px 8px 12px',
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
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1
            }}
          >
            {dirName}
          </span>
        )}
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
            <ActionButton title="New File" onClick={() => startCreate(rootDir, 'file')}>
              +
            </ActionButton>
            <ActionButton title="New Folder" onClick={() => startCreate(rootDir, 'dir')}>
              ⊕
            </ActionButton>
          </div>
        )}
        <button
          onClick={() => onCollapseChange(!collapsed)}
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
        <div
          style={{ flex: 1, overflowY: 'auto', paddingTop: 4, paddingBottom: 4 }}
          onDragOver={(e) => {
            e.preventDefault()
            e.dataTransfer.dropEffect = 'move'
          }}
          onDrop={(e) => {
            e.preventDefault()
            const sourcePath = e.dataTransfer.getData('text/plain')
            if (!sourcePath) return
            const sourceParent = sourcePath.split('/').slice(0, -1).join('/')
            if (sourceParent === rootDir) return
            void movePath(sourcePath, rootDir)
          }}
        >
          {isCreatingInRoot && (
            <InlineInput
              defaultValue=""
              onSubmit={(name) => handleCreateSubmit(rootDir, name, creatingIn!.type)}
              onCancel={() => setCreatingIn(null)}
              depth={0}
              icon={creatingIn!.type === 'dir' ? '📁' : '📄'}
            />
          )}
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
              onContextMenu={handleContextMenu}
              renamingPath={renamingPath}
              onRenameSubmit={handleRenameSubmit}
              onRenameCancel={() => setRenamingPath(null)}
              creatingIn={creatingIn}
              onCreateSubmit={handleCreateSubmit}
              onCreateCancel={() => setCreatingIn(null)}
              onMovePath={movePath}
            />
          ))}
        </div>
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          entry={contextMenu.entry}
          onNewFile={(dirPath) => startCreate(dirPath, 'file')}
          onNewFolder={(dirPath) => startCreate(dirPath, 'dir')}
          onRename={(path) => {
            setRenamingPath(path)
            setContextMenu(null)
          }}
          onDelete={(entry) => {
            void handleDelete(entry)
            setContextMenu(null)
          }}
        />
      )}
    </div>
  )
}
