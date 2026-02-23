export interface FileEntry {
  name: string
  path: string
  isDirectory: boolean
}

export interface FileContent {
  content: string
  language: string
  error: string | null
}

export interface FileDataURLResult {
  dataUrl: string
  error: string | null
}

export interface ReadDirResult {
  data: FileEntry[]
  error: string | null
}

export interface AppSettings {
  themeMode: 'light' | 'dark' | 'system'
  fontFamily: string
  fontSize: number
  terminalScrollback: number
  showHiddenFiles: boolean
  wordWrap: boolean
  windowBounds: { width: number; height: number; x: number | undefined; y: number | undefined }
  splitPosition: number | null
  fileTreeCollapsed: boolean
  leftPanelCollapsed: boolean
}

export interface Api {
  terminalReady: () => void
  terminalWrite: (data: string) => void
  terminalResize: (cols: number, rows: number) => void
  onTerminalData: (callback: (data: string) => void) => () => void
  onTerminalExit: (callback: (exitCode: number) => void) => () => void
  getWorkingDir: () => Promise<string>
  readDir: (dirPath: string) => Promise<ReadDirResult>
  readFile: (filePath: string) => Promise<FileContent>
  writeFile: (
    filePath: string,
    content: string
  ) => Promise<{ success: boolean; error: string | null }>
  readFileAsDataURL: (filePath: string) => Promise<FileDataURLResult>
  createFile: (filePath: string) => Promise<{ success: boolean; error: string | null }>
  createDir: (dirPath: string) => Promise<{ success: boolean; error: string | null }>
  deletePath: (targetPath: string) => Promise<{ success: boolean; error: string | null }>
  renamePath: (
    oldPath: string,
    newPath: string
  ) => Promise<{ success: boolean; error: string | null }>

  watchFile: (filePath: string) => void
  unwatchFile: () => void
  onFileChanged: (callback: (filePath: string) => void) => () => void
  watchTree: (rootPath: string) => void
  unwatchTree: () => void
  onTreeChanged: (callback: () => void) => () => void

  getSettings: () => Promise<AppSettings>
  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>
  onSettingsChanged: (callback: (settings: AppSettings) => void) => () => void

  getResolvedTheme: () => Promise<'dark' | 'light'>
  onThemeUpdated: (callback: (theme: 'dark' | 'light') => void) => () => void

  getMonospaceFonts: () => Promise<string[]>

  openSettingsFile: () => Promise<void>

  onMenuOpenSettings: (callback: () => void) => () => void
  onMenuToggleSidebar: (callback: () => void) => () => void
}

declare global {
  interface Window {
    api: Api
  }
}
