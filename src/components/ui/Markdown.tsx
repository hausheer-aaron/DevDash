import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { cn } from '@/lib/utils'

/** Renders trusted, user-authored Markdown (notes, readmes, resource notes). */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn('prose-dash', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
        components={{
          a({ node, ...props }) {
            void node
            return <a {...props} target="_blank" rel="noopener noreferrer" />
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
