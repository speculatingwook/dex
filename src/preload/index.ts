import { contextBridge, ipcRenderer } from 'electron'
import type { AppSettings } from './index.d'

const api = {
  terminalReady: (): void => {
    ipcRenderer.send('terminal:ready')
  },
  terminalWrite: (data: string): void => {
    ipcRenderer.send('terminal:write', data)
  },
  terminalResize: (cols: number, rows: number): void => {
    ipcRenderer.send('terminal:resize', { cols, rows })
  },
  onTerminalData: (callback: (data: string) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: string): void => callback(data)
    ipcRenderer.on('terminal:data', handler)
    return () => {
      ipcRenderer.removeListener('terminal:data', handler)
    }
  },
  onTerminalExit: (callback: (exitCode: number) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, exitCode: number): void =>
      callback(exitCode)
    ipcRenderer.on('terminal:exit', handler)
    return () => {
      ipcRenderer.removeListener('terminal:exit', handler)
    }
  },

  getWorkingDir: (): Promise<string> => ipcRenderer.invoke('fs:getWorkingDir'),
  readDir: (dirPath: string) => ipcRenderer.invoke('fs:readDir', dirPath),
  readFile: (filePath: string) => ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('fs:writeFile', filePath, content),
  readFileAsDataURL: (filePath: string) => ipcRenderer.invoke('fs:readFileAsDataURL', filePath),

  watchFile: (filePath: string): void => {
    ipcRenderer.send('fs:watchFile', filePath)
  },
  unwatchFile: (): void => {
    ipcRenderer.send('fs:unwatchFile')
  },
  onFileChanged: (callback: (filePath: string) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, filePath: string): void => callback(filePath)
    ipcRenderer.on('fs:fileChanged', handler)
    return () => {
      ipcRenderer.removeListener('fs:fileChanged', handler)
    }
  },

  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke('settings:getAll'),
  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void> =>
    ipcRenderer.invoke('settings:set', key, value),
  onSettingsChanged: (callback: (settings: AppSettings) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, settings: AppSettings): void =>
      callback(settings)
    ipcRenderer.on('settings:changed', handler)
    return () => {
      ipcRenderer.removeListener('settings:changed', handler)
    }
  },

  getResolvedTheme: (): Promise<'dark' | 'light'> => ipcRenderer.invoke('theme:getResolved'),
  onThemeUpdated: (callback: (theme: 'dark' | 'light') => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, theme: 'dark' | 'light'): void =>
      callback(theme)
    ipcRenderer.on('theme:updated', handler)
    return () => {
      ipcRenderer.removeListener('theme:updated', handler)
    }
  },

  getMonospaceFonts: (): Promise<string[]> => ipcRenderer.invoke('settings:getMonospaceFonts'),

  openSettingsFile: (): Promise<void> => ipcRenderer.invoke('settings:openFile'),

  onMenuOpenSettings: (callback: () => void): (() => void) => {
    const handler = (): void => callback()
    ipcRenderer.on('menu:openSettings', handler)
    return () => {
      ipcRenderer.removeListener('menu:openSettings', handler)
    }
  },
  onMenuToggleSidebar: (callback: () => void): (() => void) => {
    const handler = (): void => callback()
    ipcRenderer.on('menu:toggleSidebar', handler)
    return () => {
      ipcRenderer.removeListener('menu:toggleSidebar', handler)
    }
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  ;(window as unknown as Record<string, unknown>).api = api
}
