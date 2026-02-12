import { app, shell, BrowserWindow, ipcMain, nativeTheme, Menu } from 'electron'
import { join, basename } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'
import * as fsSync from 'fs'
import * as pty from 'node-pty'
import { settingsStore, MONOSPACE_FONTS } from './settings'
import type { AppSettings } from './settings'
import icon from '../../resources/icon.png?asset'

function getWorkingDir(): string {
  const args = process.argv.slice(is.dev ? 2 : 1)
  for (const arg of args) {
    if (arg.startsWith('--working-dir=')) {
      return arg.split('=')[1]
    }
  }
  const lastArg = args[args.length - 1]
  if (lastArg && !lastArg.startsWith('-')) {
    try {
      return path.resolve(lastArg)
    } catch {
      /* noop */
    }
  }
  return process.cwd()
}

const workingDir = getWorkingDir()

const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.py': 'python',
  '.json': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.css': 'css',
  '.scss': 'css',
  '.html': 'xml',
  '.htm': 'xml',
  '.xml': 'xml',
  '.svg': 'xml',
  '.sh': 'bash',
  '.bash': 'bash',
  '.zsh': 'bash',
  '.go': 'go',
  '.rs': 'rust',
  '.java': 'java',
  '.c': 'c',
  '.cpp': 'cpp',
  '.h': 'c',
  '.hpp': 'cpp',
  '.rb': 'ruby',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.md': 'markdown',
  '.mdx': 'markdown',
  '.sql': 'sql',
  '.toml': 'ini',
  '.ini': 'ini',
  '.env': 'bash',
  '.dockerfile': 'dockerfile'
}

function getLanguageFromPath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  const baseName = path.basename(filePath).toLowerCase()
  if (baseName === 'dockerfile') return 'dockerfile'
  if (baseName === 'makefile') return 'makefile'
  return EXTENSION_LANGUAGE_MAP[ext] || 'plaintext'
}

const HIDDEN_PATTERNS = ['.git', '.DS_Store', 'node_modules', '.next', '.cache', '__pycache__']

function isHidden(name: string): boolean {
  const showHidden = settingsStore.get('showHiddenFiles')
  if (showHidden) return false
  if (name.startsWith('.')) return true
  return HIDDEN_PATTERNS.includes(name)
}

function isPathSafe(requestedPath: string): boolean {
  const resolved = path.resolve(requestedPath)
  const base = path.resolve(workingDir)
  return resolved.startsWith(base)
}

let ptyProcess: pty.IPty | null = null
let mainWindow: BrowserWindow | null = null

function killPty(): void {
  if (ptyProcess) {
    try {
      ptyProcess.kill()
    } catch {
      /* already dead */
    }
    ptyProcess = null
  }
}

function getResolvedTheme(): 'dark' | 'light' {
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
}

function buildAppMenu(): void {
  const isMac = process.platform === 'darwin'

  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              {
                label: 'Settings…',
                accelerator: 'CmdOrCtrl+,',
                click: (): void => {
                  mainWindow?.webContents.send('menu:openSettings')
                }
              },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const }
            ] as Electron.MenuItemConstructorOptions[]
          }
        ]
      : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'Toggle Sidebar',
          accelerator: 'CmdOrCtrl+B',
          click: (): void => {
            mainWindow?.webContents.send('menu:toggleSidebar')
          }
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    { role: 'windowMenu' }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

function createWindow(): void {
  const bounds = settingsStore.get('windowBounds')

  mainWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    minWidth: 800,
    minHeight: 500,
    show: false,
    title: `dex — ${basename(workingDir)}`,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 15 },
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  const saveBounds = (): void => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    const [x, y] = mainWindow.getPosition()
    const [width, height] = mainWindow.getSize()
    settingsStore.set('windowBounds', { width, height, x, y })
  }

  mainWindow.on('resized', saveBounds)
  mainWindow.on('moved', saveBounds)

  mainWindow.on('closed', () => {
    killPty()
    mainWindow = null
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function resolveShell(): string {
  if (os.platform() === 'win32') {
    const candidates = [process.env.COMSPEC, 'powershell.exe', 'cmd.exe']
    for (const c of candidates) {
      if (c) return c
    }
    return 'cmd.exe'
  }

  const unixCandidates = [
    process.env.SHELL,
    '/bin/zsh',
    '/bin/bash',
    '/usr/bin/zsh',
    '/usr/bin/bash',
    '/bin/sh'
  ]

  for (const c of unixCandidates) {
    if (c && fsSync.existsSync(c)) {
      try {
        fsSync.accessSync(c, fsSync.constants.X_OK)
        return c
      } catch {
        continue
      }
    }
  }

  return '/bin/sh'
}

function setupTerminalIPC(): void {
  ipcMain.on('terminal:ready', () => {
    killPty()

    const userShell = resolveShell()

    const filteredEnv: Record<string, string> = {}
    for (const [key, value] of Object.entries(process.env)) {
      if (
        value !== undefined &&
        !key.startsWith('ELECTRON_') &&
        key !== 'GOOGLE_API_KEY' &&
        key !== 'ORIGINAL_XDG_CURRENT_DESKTOP'
      ) {
        filteredEnv[key] = value
      }
    }
    filteredEnv['TERM'] = 'xterm-256color'

    ptyProcess = pty.spawn(userShell, [], {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd: workingDir,
      env: filteredEnv
    })

    ptyProcess.onData((data) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('terminal:data', data)
      }
    })

    ptyProcess.onExit(({ exitCode }) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('terminal:exit', exitCode)
      }
    })
  })

  ipcMain.on('terminal:write', (_event, data: string) => {
    ptyProcess?.write(data)
  })

  ipcMain.on('terminal:resize', (_event, { cols, rows }: { cols: number; rows: number }) => {
    if (!Number.isInteger(cols) || !Number.isInteger(rows) || cols < 1 || rows < 1) return
    try {
      ptyProcess?.resize(cols, rows)
    } catch {
      /* noop */
    }
  })
}

function setupFileSystemIPC(): void {
  ipcMain.handle('fs:getWorkingDir', () => workingDir)

  ipcMain.handle('fs:readDir', async (_event, dirPath: string) => {
    if (!isPathSafe(dirPath)) {
      return { data: [], error: 'Access denied' }
    }
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      const result = entries
        .filter((entry) => !isHidden(entry.name))
        .map((entry) => ({
          name: entry.name,
          path: path.join(dirPath, entry.name),
          isDirectory: entry.isDirectory()
        }))
        .sort((a, b) => {
          if (a.isDirectory && !b.isDirectory) return -1
          if (!a.isDirectory && b.isDirectory) return 1
          return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
        })
      return { data: result, error: null }
    } catch (err) {
      return { data: [], error: (err as Error).message }
    }
  })

  ipcMain.handle('fs:writeFile', async (_event, filePath: string, content: string) => {
    if (!isPathSafe(filePath)) {
      return { success: false, error: 'Access denied' }
    }
    try {
      await fs.writeFile(filePath, content, 'utf-8')
      return { success: true, error: null }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
    if (!isPathSafe(filePath)) {
      return { content: '', language: 'plaintext', error: 'Access denied' }
    }
    try {
      const stat = await fs.stat(filePath)
      if (stat.size > 5 * 1024 * 1024) {
        return { content: '', language: 'plaintext', error: 'File too large (>5MB)' }
      }
      const buffer = await fs.readFile(filePath)
      const isBinary = buffer.some((byte) => byte === 0)
      if (isBinary) {
        return { content: '', language: 'plaintext', error: 'Binary file — cannot display' }
      }
      const content = buffer.toString('utf-8')
      const language = getLanguageFromPath(filePath)
      return { content, language, error: null }
    } catch (err) {
      return { content: '', language: 'plaintext', error: (err as Error).message }
    }
  })
}

function setupSettingsIPC(): void {
  ipcMain.handle('settings:getAll', () => {
    return settingsStore.store
  })

  ipcMain.handle(
    'settings:set',
    (_event, key: keyof AppSettings, value: AppSettings[keyof AppSettings]) => {
      settingsStore.set(key, value)

      if (key === 'themeMode') {
        nativeTheme.themeSource = value as 'light' | 'dark' | 'system'
      }

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('settings:changed', settingsStore.store)
      }
    }
  )

  ipcMain.handle('settings:getMonospaceFonts', () => {
    return MONOSPACE_FONTS
  })

  ipcMain.handle('settings:openFile', () => {
    shell.openPath(settingsStore.path)
  })

  ipcMain.handle('theme:getResolved', () => {
    return getResolvedTheme()
  })
}

function setupNativeTheme(): void {
  const savedMode = settingsStore.get('themeMode')
  nativeTheme.themeSource = savedMode

  nativeTheme.on('updated', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('theme:updated', getResolvedTheme())
    }
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.dex.app')

  app.setAboutPanelOptions({
    applicationName: 'dex',
    applicationVersion: app.getVersion(),
    copyright: '© 2026 dex'
  })

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  setupNativeTheme()
  buildAppMenu()
  setupTerminalIPC()
  setupFileSystemIPC()
  setupSettingsIPC()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('before-quit', () => {
  killPty()
})

app.on('window-all-closed', () => {
  killPty()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
