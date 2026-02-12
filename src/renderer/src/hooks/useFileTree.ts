import { useState, useEffect, useCallback } from 'react'
import type { FileEntry } from '../../../preload/index.d'

interface UseFileTreeReturn {
  rootDir: string
  entries: Map<string, FileEntry[]>
  expandedDirs: Set<string>
  toggleDir: (dirPath: string) => void
  selectedFile: string | null
  selectFile: (filePath: string) => void
}

export function useFileTree(onFileSelect: (path: string) => void): UseFileTreeReturn {
  const [rootDir, setRootDir] = useState('')
  const [entries, setEntries] = useState<Map<string, FileEntry[]>>(new Map())
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  const loadDir = useCallback(async (dirPath: string) => {
    const result = await window.api.readDir(dirPath)
    if (!result.error) {
      setEntries((prev) => {
        const next = new Map(prev)
        next.set(dirPath, result.data)
        return next
      })
    }
  }, [])

  useEffect(() => {
    window.api.getWorkingDir().then((dir) => {
      setRootDir(dir)
      loadDir(dir)
      setExpandedDirs(new Set([dir]))
    })
  }, [loadDir])

  const toggleDir = useCallback(
    (dirPath: string) => {
      setExpandedDirs((prev) => {
        const next = new Set(prev)
        if (next.has(dirPath)) {
          next.delete(dirPath)
        } else {
          next.add(dirPath)
          if (!entries.has(dirPath)) {
            loadDir(dirPath)
          }
        }
        return next
      })
    },
    [entries, loadDir]
  )

  const selectFile = useCallback(
    (filePath: string) => {
      setSelectedFile(filePath)
      onFileSelect(filePath)
    },
    [onFileSelect]
  )

  return { rootDir, entries, expandedDirs, toggleDir, selectedFile, selectFile }
}
