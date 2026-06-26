import { useMemo, useState } from 'react'
import hljs from 'highlight.js/lib/core'
import { Check, Copy } from 'lucide-react'
import { cn, copyToClipboard } from '@/lib/utils'
import { registerHljsLanguages } from '@/lib/hljs'

registerHljsLanguages(hljs)

interface CodeBlockProps {
  code: string
  language?: string
  /** Show a header bar with language label + copy button. */
  filename?: string
  showCopy?: boolean
  className?: string
  /** Cap height and scroll; otherwise grow to content. */
  maxHeight?: number
}

export function CodeBlock({
  code,
  language = 'plaintext',
  filename,
  showCopy = true,
  className,
  maxHeight,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const html = useMemo(() => {
    const lang = hljs.getLanguage(language) ? language : 'plaintext'
    try {
      return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value
    } catch {
      return escapeHtml(code)
    }
  }, [code, language])

  const onCopy = async () => {
    if (await copyToClipboard(code)) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    }
  }

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border bg-[#0c0c10]',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border/70 px-3.5 py-2">
        <span className="font-mono text-[0.6875rem] uppercase tracking-wide text-faint">
          {filename ?? language}
        </span>
        {showCopy && (
          <button
            onClick={onCopy}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-faint opacity-0 transition hover:bg-surface-hover hover:text-fg focus:opacity-100 group-hover:opacity-100"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-success" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> Copy
              </>
            )}
          </button>
        )}
      </div>
      <pre
        className="scrollbar-thin overflow-auto p-4 text-[0.8125rem] leading-relaxed"
        style={maxHeight ? { maxHeight } : undefined}
      >
        <code
          className="hljs font-mono"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </pre>
    </div>
  )
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
