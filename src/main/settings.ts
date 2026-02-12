import { app } from 'electron'
import * as path from 'path'
import * as fs from 'fs'

export interface AppSettings {
  // Appearance
  themeMode: 'light' | 'dark' | 'system'

  // Font (monospace — used for terminal + code viewer)
  fontFamily: string
  fontSize: number

  // Terminal
  terminalScrollback: number

  // File Tree
  showHiddenFiles: boolean

  // Editor
  wordWrap: boolean

  // Window State (internal — not shown in settings UI)
  windowBounds: { width: number; height: number; x: number | undefined; y: number | undefined }
  splitPosition: number | null
  fileTreeCollapsed: boolean
  leftPanelCollapsed: boolean
}

export const MONOSPACE_FONTS = [
  'Menlo',
  'Monaco',
  'SF Mono',
  'Consolas',
  'Cascadia Code',
  'Cascadia Mono',
  'JetBrains Mono',
  'Fira Code',
  'Source Code Pro',
  'DejaVu Sans Mono',
  'Ubuntu Mono',
  'Courier New'
]

export const DEFAULT_SETTINGS: AppSettings = {
  themeMode: 'system',
  fontFamily: 'Menlo, Monaco, "Courier New", monospace',
  fontSize: 14,
  terminalScrollback: 5000,
  showHiddenFiles: false,
  wordWrap: false,
  windowBounds: { width: 1400, height: 900, x: undefined, y: undefined },
  splitPosition: null,
  fileTreeCollapsed: false,
  leftPanelCollapsed: false
}

class SettingsStore {
  private data: AppSettings
  private filePath: string

  constructor() {
    const userDataPath = app.getPath('userData')
    this.filePath = path.join(userDataPath, 'settings.json')
    this.data = this.load()
  }

  get path(): string {
    return this.filePath
  }

  get store(): AppSettings {
    return { ...this.data }
  }

  get<K extends keyof AppSettings>(key: K): AppSettings[K] {
    return this.data[key]
  }

  set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    this.data[key] = value
    this.save()
  }

  private load(): AppSettings {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8')
        const parsed = JSON.parse(raw)
        return { ...DEFAULT_SETTINGS, ...parsed }
      }
    } catch {
      /* corrupted file — use defaults */
    }
    return { ...DEFAULT_SETTINGS }
  }

  private save(): void {
    try {
      const dir = path.dirname(this.filePath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8')
    } catch {
      /* write failure — non-critical */
    }
  }
}

export const settingsStore = new SettingsStore()
