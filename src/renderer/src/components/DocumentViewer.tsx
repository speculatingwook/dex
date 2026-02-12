import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react'
import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'
import { useSettings } from '../hooks/useSettings'
import { useTheme } from '../hooks/useTheme'

const CodeMirrorEditor = lazy(() => import('./CodeMirrorEditor'))

const MARKDOWN_EXTENSIONS = new Set(['.md', '.mdx', '.markdown'])
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp', '.ico'])
const CODE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.py',
  '.json',
  '.yaml',
  '.yml',
  '.css',
  '.scss',
  '.html',
  '.htm',
  '.xml',
  '.sh',
  '.bash',
  '.zsh',
  '.go',
  '.rs',
  '.java',
  '.c',
  '.cpp',
  '.h',
  '.hpp',
  '.rb',
  '.swift',
  '.kt',
  '.sql',
  '.toml',
  '.ini',
  '.env'
])

type ViewMode = 'markdown' | 'code' | 'text' | 'image' | 'none'

function getViewMode(filePath: string): ViewMode {
  const ext = '.' + filePath.split('.').pop()?.toLowerCase()
  if (IMAGE_EXTENSIONS.has(ext)) return 'image'
  if (MARKDOWN_EXTENSIONS.has(ext)) return 'markdown'
  if (CODE_EXTENSIONS.has(ext)) return 'code'
  return 'text'
}

function getLanguageForExt(filePath: string): string {
  const ext = '.' + filePath.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
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
    '.sql': 'sql',
    '.toml': 'ini',
    '.ini': 'ini',
    '.env': 'bash'
  }
  return map[ext] || 'plaintext'
}

const marked = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
      return hljs.highlight(code, { language }).value
    }
  })
)

async function resolveLocalImages(html: string, mdFilePath: string): Promise<string> {
  const dir = mdFilePath.split('/').slice(0, -1).join('/')
  const imgRegex = /<img\s+[^>]*src="([^"]*)"[^>]*/gi
  const matches = [...html.matchAll(imgRegex)]

  let result = html
  for (const match of matches) {
    const src = match[1]
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) continue

    const absolutePath = src.startsWith('/') ? src : `${dir}/${src}`
    const dataResult = await window.api.readFileAsDataURL(absolutePath)
    if (dataResult.error) continue

    result = result.replace(src, dataResult.dataUrl)
  }

  return result
}

interface DocumentViewerProps {
  filePath: string | null
}

export default function DocumentViewer({ filePath }: DocumentViewerProps): React.JSX.Element {
  const [content, setContent] = useState('')
  const [renderedHtml, setRenderedHtml] = useState('')
  const [imageDataUrl, setImageDataUrl] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('none')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [modifiedContent, setModifiedContent] = useState('')
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null)
  const [externalChange, setExternalChange] = useState(false)
  
  const { settings } = useSettings()
  const { resolvedTheme } = useTheme()
  
  const fontFamily = settings?.fontFamily ?? 'Menlo, Monaco, "Courier New", monospace'
  const fontSize = settings?.fontSize ?? 14
  const codeFontSize = Math.max(fontSize - 1, 10)
  const wordWrap = settings?.wordWrap ?? false

  const justSavedRef = useRef(false)
  const isEditingRef = useRef(false)
  const isDirtyRef = useRef(false)
  const currentFileRef = useRef<string | null>(null)

  isEditingRef.current = isEditing

  const loadFileContent = useCallback(async (fp: string): Promise<void> => {
    const mode = getViewMode(fp)

    if (mode === 'image') {
      const result = await window.api.readFileAsDataURL(fp)
      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }
      setViewMode('image')
      setImageDataUrl(result.dataUrl)
      setLoading(false)
      return
    }

    const result = await window.api.readFile(fp)
    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setViewMode(mode)
    setContent(result.content)
    setModifiedContent(result.content)

    if (mode === 'markdown') {
      let html = await marked.parse(result.content) as string
      html = await resolveLocalImages(html, fp)
      setRenderedHtml(html)
    } else if (mode === 'code') {
      const lang = getLanguageForExt(fp)
      const highlighted = hljs.getLanguage(lang)
        ? hljs.highlight(result.content, { language: lang }).value
        : result.content
      setRenderedHtml(highlighted)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    if (!filePath) {
      setViewMode('none')
      setIsEditing(false)
      setModifiedContent('')
      setImageDataUrl('')
      setExternalChange(false)
      window.api.unwatchFile()
      currentFileRef.current = null
      return
    }

    currentFileRef.current = filePath
    setLoading(true)
    setError(null)
    setIsEditing(false)
    setModifiedContent('')
    setImageDataUrl('')
    setSaveStatus(null)
    setExternalChange(false)

    loadFileContent(filePath)

    window.api.watchFile(filePath)

    const cleanup = window.api.onFileChanged((changedPath) => {
      if (changedPath !== currentFileRef.current) return
      if (justSavedRef.current) return

      if (isEditingRef.current && isDirtyRef.current) {
        setExternalChange(true)
        return
      }

      loadFileContent(changedPath)
    })

    return () => {
      cleanup()
      window.api.unwatchFile()
    }
  }, [filePath, loadFileContent])

  const handleSave = async (): Promise<void> => {
    if (!filePath) return
    setSaveStatus('saving')

    justSavedRef.current = true
    setTimeout(() => { justSavedRef.current = false }, 500)

    try {
      await window.api.writeFile(filePath, modifiedContent)
      setSaveStatus('saved')
      setContent(modifiedContent)
      setExternalChange(false)
      
      if (viewMode === 'markdown') {
        let html = await marked.parse(modifiedContent) as string
        html = await resolveLocalImages(html, filePath)
        setRenderedHtml(html)
      } else if (viewMode === 'code') {
        const lang = getLanguageForExt(filePath)
        const highlighted = hljs.getLanguage(lang)
          ? hljs.highlight(modifiedContent, { language: lang }).value
          : modifiedContent
        setRenderedHtml(highlighted)
      }

      setTimeout(() => setSaveStatus(null), 2000)
    } catch (err) {
      console.error(err)
      setSaveStatus('error')
    }
  }

  const toggleEdit = (): void => {
    if (!isEditing) {
      setModifiedContent(content)
      setExternalChange(false)
    }
    setIsEditing(!isEditing)
  }

  const containerStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  }

  if (viewMode === 'none') {
    return (
      <div
        style={{
          ...containerStyle,
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: 14,
          background: 'var(--bg-tertiary)'
        }}
      >
        Select a file to view
      </div>
    )
  }

  if (loading) {
    return (
      <div
        style={{
          ...containerStyle,
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          background: 'var(--bg-tertiary)'
        }}
      >
        Loading...
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          ...containerStyle,
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-error)',
          fontSize: 13,
          background: 'var(--bg-tertiary)',
          padding: 24
        }}
      >
        {error}
      </div>
    )
  }

  const fileName = filePath ? filePath.split('/').pop() : ''
  const isDirty = modifiedContent !== content
  isDirtyRef.current = isDirty

  return (
    <div style={{ ...containerStyle, height: '100%' }}>
      <div
        style={{
          height: 36,
          minHeight: 36,
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px'
        }}
      >
        <div style={{ 
          fontSize: 13, 
          fontWeight: 500, 
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          {fileName}
          {isDirty && (
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--accent)'
              }}
            />
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {externalChange && (
            <span style={{ fontSize: 11, color: 'var(--accent)', fontStyle: 'italic' }}>
              File changed on disk
            </span>
          )}
          {isEditing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
               {saveStatus === 'saved' && (
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Saved</span>
              )}
               {saveStatus === 'error' && (
                <span style={{ fontSize: 12, color: 'var(--text-error)' }}>Error</span>
              )}
              <button
                onClick={handleSave}
                style={{
                  background: 'var(--bg-button)',
                  border: '1px solid var(--border-button)',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  padding: '2px 8px',
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              >
                Save
              </button>
            </div>
          )}
          {viewMode !== 'image' && (
            <button
              onClick={toggleEdit}
              style={{
                background: isEditing ? 'var(--bg-button)' : 'transparent',
                border: '1px solid var(--border-button)',
                color: 'var(--text-primary)',
                fontSize: 12,
                padding: '2px 8px',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              {isEditing ? 'View' : 'Edit'}
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {viewMode === 'image' ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-tertiary)',
              padding: 24,
              overflow: 'auto'
            }}
          >
            <img
              src={imageDataUrl}
              alt={fileName || ''}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
            />
          </div>
        ) : isEditing ? (
          <Suspense fallback={
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: 'var(--text-muted)' 
            }}>
              Loading editor...
            </div>
          }>
            <CodeMirrorEditor
              content={modifiedContent}
              language={filePath ? getLanguageForExt(filePath) : 'plaintext'}
              theme={resolvedTheme}
              fontFamily={fontFamily}
              fontSize={codeFontSize}
              wordWrap={wordWrap}
              onChange={setModifiedContent}
              onSave={handleSave}
            />
          </Suspense>
        ) : (
          viewMode === 'markdown' ? (
            <div
              style={{
                height: '100%',
                overflowY: 'auto',
                background: 'var(--bg-tertiary)',
                padding: '24px 32px'
              }}
            >
              <div
                className="markdown-body"
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
                style={{ maxWidth: 800 }}
              />
            </div>
          ) : (
            <div style={{ height: '100%', overflow: 'auto', background: 'var(--bg-tertiary)' }}>
              <table style={{
                borderCollapse: 'collapse',
                fontFamily,
                fontSize: codeFontSize,
                lineHeight: '20px'
              }}>
                <tbody>
                  {content.split('\n').map((line, i) => (
                    <tr key={i}>
                      <td style={{
                        padding: '0 12px 0 16px',
                        textAlign: 'right',
                        color: 'var(--text-dim)',
                        userSelect: 'none',
                        whiteSpace: 'nowrap',
                        verticalAlign: 'top',
                        width: 1
                      }}>{i + 1}</td>
                      <td style={{
                        padding: '0 16px 0 12px',
                        whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
                        wordBreak: wordWrap ? 'break-all' : undefined,
                        color: 'var(--text-primary)'
                      }}>
                        {viewMode === 'code' ? (
                          <span dangerouslySetInnerHTML={{ __html: renderedHtml.split('\n')[i] || '' }} />
                        ) : (
                          line
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  )
}
