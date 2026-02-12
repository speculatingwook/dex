import { useEffect, useRef, type RefObject } from 'react'
import { Terminal, type ITheme } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { Unicode11Addon } from '@xterm/addon-unicode11'
import type { ResolvedTheme } from './useTheme'

const DARK_THEME: ITheme = {
  background: '#1a1b26',
  foreground: '#a9b1d6',
  cursor: '#c0caf5',
  selectionBackground: '#33467c',
  black: '#15161e',
  red: '#f7768e',
  green: '#9ece6a',
  yellow: '#e0af68',
  blue: '#7aa2f7',
  magenta: '#bb9af7',
  cyan: '#7dcfff',
  white: '#a9b1d6',
  brightBlack: '#414868',
  brightRed: '#f7768e',
  brightGreen: '#9ece6a',
  brightYellow: '#e0af68',
  brightBlue: '#7aa2f7',
  brightMagenta: '#bb9af7',
  brightCyan: '#7dcfff',
  brightWhite: '#c0caf5'
}

const LIGHT_THEME: ITheme = {
  background: '#ffffff',
  foreground: '#24292e',
  cursor: '#24292e',
  selectionBackground: '#b6d7ff',
  black: '#24292e',
  red: '#cf222e',
  green: '#116329',
  yellow: '#4d2d00',
  blue: '#0969da',
  magenta: '#8250df',
  cyan: '#1b7c83',
  white: '#6e7781',
  brightBlack: '#57606a',
  brightRed: '#a40e26',
  brightGreen: '#1a7f37',
  brightYellow: '#633c01',
  brightBlue: '#218bff',
  brightMagenta: '#a475f9',
  brightCyan: '#3192aa',
  brightWhite: '#8c959f'
}

function getTerminalTheme(theme: ResolvedTheme): ITheme {
  return theme === 'dark' ? DARK_THEME : LIGHT_THEME
}

interface TerminalOptions {
  fontFamily: string
  fontSize: number
  scrollback: number
}

export function useTerminal(
  containerRef: RefObject<HTMLDivElement | null>,
  theme: ResolvedTheme,
  options: TerminalOptions
): void {
  const terminalRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.options.theme = getTerminalTheme(theme)
    }
  }, [theme])

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.options.fontFamily = options.fontFamily
      terminalRef.current.options.fontSize = options.fontSize
      fitAddonRef.current?.fit()
    }
  }, [options.fontFamily, options.fontSize])

  useEffect(() => {
    if (!containerRef.current) return

    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: options.fontSize,
      fontFamily: options.fontFamily,
      theme: getTerminalTheme(theme),
      scrollback: options.scrollback,
      allowProposedApi: true
    })

    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()
    const unicode11Addon = new Unicode11Addon()

    terminal.loadAddon(fitAddon)
    terminal.loadAddon(webLinksAddon)
    terminal.loadAddon(unicode11Addon)
    terminal.unicode.activeVersion = '11'
    terminal.open(containerRef.current)

    const fitAndSync = (): void => {
      try {
        fitAddon.fit()
        window.api.terminalResize(terminal.cols, terminal.rows)
      } catch {
        /* container not ready */
      }
    }

    requestAnimationFrame(() => {
      fitAndSync()
      requestAnimationFrame(() => {
        fitAndSync()
        window.api.terminalReady()
      })
    })

    const cleanupData = window.api.onTerminalData((data) => {
      terminal.write(data)
    })

    const cleanupExit = window.api.onTerminalExit(() => {
      terminal.write('\r\n\x1b[90m[Process exited]\x1b[0m\r\n')
    })

    terminal.onData((data) => {
      window.api.terminalWrite(data)
    })

    let resizeTimer: ReturnType<typeof setTimeout> | null = null
    const resizeObserver = new ResizeObserver(() => {
      if (resizeTimer) clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        requestAnimationFrame(fitAndSync)
      }, 50)
    })
    resizeObserver.observe(containerRef.current)

    terminalRef.current = terminal
    fitAddonRef.current = fitAddon

    return () => {
      if (resizeTimer) clearTimeout(resizeTimer)
      cleanupData()
      cleanupExit()
      resizeObserver.disconnect()
      terminal.dispose()
      terminalRef.current = null
      fitAddonRef.current = null
    }
  }, [containerRef])
}
