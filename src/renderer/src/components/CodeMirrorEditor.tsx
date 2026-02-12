import { useEffect, useRef, useCallback } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState, Compartment } from '@codemirror/state'
import { keymap } from '@codemirror/view'
import { oneDark } from '@codemirror/theme-one-dark'
import { languages } from '@codemirror/language-data'

interface CodeMirrorEditorProps {
  content: string
  language: string
  theme: 'dark' | 'light'
  fontFamily: string
  fontSize: number
  wordWrap: boolean
  onChange: (content: string) => void
  onSave: () => void
}

function buildThemeExtension(t: 'dark' | 'light') {
  return t === 'dark' ? oneDark : EditorView.theme({}, { dark: false })
}

function buildStyleExtension(ff: string, fs: number, t: 'dark' | 'light') {
  return EditorView.theme({
    '&': { height: '100%', fontSize: `${fs}px` },
    '.cm-content': { fontFamily: ff },
    '.cm-gutters': {
      fontFamily: ff,
      backgroundColor: t === 'dark' ? '#282c34' : '#f5f5f5',
      borderRight: '1px solid var(--border)'
    },
    '.cm-focused': { outline: 'none' }
  })
}

export default function CodeMirrorEditor({
  content,
  language,
  theme,
  fontFamily,
  fontSize,
  wordWrap,
  onChange,
  onSave
}: CodeMirrorEditorProps): React.JSX.Element {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  // Stable refs so EditorView closures always call the latest callback
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const onSaveRef = useRef(onSave)
  onSaveRef.current = onSave

  const languageCompartment = useRef(new Compartment())
  const themeCompartment = useRef(new Compartment())
  const styleCompartment = useRef(new Compartment())
  const wrapCompartment = useRef(new Compartment())

  const loadLanguage = useCallback(async (lang: string) => {
    const desc = languages.find(
      (l) =>
        l.name.toLowerCase() === lang.toLowerCase() ||
        l.alias.some((a) => a.toLowerCase() === lang.toLowerCase())
    )
    const ext = desc ? await desc.load() : []
    viewRef.current?.dispatch({
      effects: languageCompartment.current.reconfigure(ext)
    })
  }, [])

  useEffect(() => {
    if (!editorRef.current) return

    const state = EditorState.create({
      doc: content,
      extensions: [
        basicSetup,
        keymap.of([
          {
            key: 'Mod-s',
            run: () => {
              onSaveRef.current()
              return true
            }
          }
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString())
          }
        }),
        languageCompartment.current.of([]),
        themeCompartment.current.of(buildThemeExtension(theme)),
        styleCompartment.current.of(buildStyleExtension(fontFamily, fontSize, theme)),
        wrapCompartment.current.of(wordWrap ? EditorView.lineWrapping : [])
      ]
    })

    const view = new EditorView({ state, parent: editorRef.current })
    viewRef.current = view

    loadLanguage(language)

    return () => {
      view.destroy()
      viewRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (viewRef.current) loadLanguage(language)
  }, [language, loadLanguage])

  useEffect(() => {
    if (!viewRef.current) return
    viewRef.current.dispatch({
      effects: [
        themeCompartment.current.reconfigure(buildThemeExtension(theme)),
        styleCompartment.current.reconfigure(buildStyleExtension(fontFamily, fontSize, theme))
      ]
    })
  }, [theme, fontFamily, fontSize])

  useEffect(() => {
    if (!viewRef.current) return
    viewRef.current.dispatch({
      effects: wrapCompartment.current.reconfigure(wordWrap ? EditorView.lineWrapping : [])
    })
  }, [wordWrap])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    if (content !== view.state.doc.toString()) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: content }
      })
    }
  }, [content])

  return <div ref={editorRef} style={{ height: '100%', width: '100%', overflow: 'hidden' }} />
}
