import { useState, useEffect, useCallback, useRef } from 'react'
import type { FileEntry } from '../../../preload/index.d'

interface UseFileTreeReturn {
  rootDir: string
  entries: Map<string, FileEntry[]>
  expandedDirs: Set<string>
  toggleDir: (dirPath: string) => void
  selectedFile: string | null
  selectFile: (filePath: string) => void
  createFile: (parentDir: string, name: string) => Promise<boolean>
  createDir: (parentDir: string, name: string) => Promise<boolean>
  deletePath: (targetPath: string) => Promise<boolean>
  renamePath: (oldPath: string, newName: string) => Promise<boolean>
}

export function useFileTree(onFileSelect: (path: string | null) => void): UseFileTreeReturn {
  const [rootDir, setRootDir] = useState('')
  const [entries, setEntries] = useState<Map<string, FileEntry[]>>(new Map())
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const expandedDirsRef = useRef<Set<string>>(new Set())
  const selectedFileRef = useRef<string | null>(null)

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
    expandedDirsRef.current = expandedDirs
  }, [expandedDirs])

  useEffect(() => {
    selectedFileRef.current = selectedFile
  }, [selectedFile])

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

  const createFile = useCallback(
    async (parentDir: string, name: string): Promise<boolean> => {
      const filePath = parentDir + '/' + name
      const result = await window.api.createFile(filePath)
      if (result.success) {
        await loadDir(parentDir)
        setSelectedFile(filePath)
        onFileSelect(filePath)
      }
      return result.success
    },
    [loadDir, onFileSelect]
  )

  const createDir = useCallback(
    async (parentDir: string, name: string): Promise<boolean> => {
      const dirPath = parentDir + '/' + name
      const result = await window.api.createDir(dirPath)
      if (result.success) {
        await loadDir(parentDir)
        setExpandedDirs((prev) => {
          const next = new Set(prev)
          next.add(dirPath)
          return next
        })
        void loadDir(dirPath)
      }
      return result.success
    },
    [loadDir]
  )

  const deletePath = useCallback(
    async (targetPath: string): Promise<boolean> => {
      const result = await window.api.deletePath(targetPath)
      if (result.success) {
        const parts = targetPath.split('/')
        parts.pop()
        const parentDir = parts.join('/')
        await loadDir(parentDir)
        if (selectedFileRef.current === targetPath) {
          setSelectedFile(null)
          onFileSelect(null)
        }
      }
      return result.success
    },
    [loadDir, onFileSelect]
  )

  const renamePath = useCallback(
    async (oldPath: string, newName: string): Promise<boolean> => {
      const parts = oldPath.split('/')
      parts.pop()
      const parentDir = parts.join('/')
      const newPath = parentDir + '/' + newName
      const result = await window.api.renamePath(oldPath, newPath)
      if (result.success) {
        await loadDir(parentDir)
        if (selectedFileRef.current === oldPath) {
          setSelectedFile(newPath)
          onFileSelect(newPath)
        }
      }
      return result.success
    },
    [loadDir, onFileSelect]
  )

  useEffect(() => {
    if (!rootDir) return

    window.api.watchTree(rootDir)
    const cleanup = window.api.onTreeChanged(() => {
      const dirsToReload = new Set(expandedDirsRef.current)
      dirsToReload.add(rootDir)
      void Promise.all(Array.from(dirsToReload).map((dir) => loadDir(dir)))
    })

    return () => {
      cleanup()
      window.api.unwatchTree()
    }
  }, [rootDir, loadDir])

  return {
    rootDir,
    entries,
    expandedDirs,
    toggleDir,
    selectedFile,
    selectFile,
    createFile,
    createDir,
    deletePath,
    renamePath
  }
}
