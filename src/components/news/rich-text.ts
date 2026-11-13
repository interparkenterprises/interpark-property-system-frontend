const HTML_TAG_PATTERN = /<\/?[a-z][^>]*>/i

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export function normalizeNewsContent(content: string) {
  if (!content) return ''
  if (HTML_TAG_PATTERN.test(content)) return content

  return content
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll('\n', '<br>')}</p>`)
    .join('')
}

export function getNewsTextPreview(content: string) {
  if (!content) return ''
  if (!HTML_TAG_PATTERN.test(content)) return content

  return content
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>|<\/h[2-4]>|<\/li>|<\/blockquote>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#039;', "'")
    .replace(/\s+/g, ' ')
    .trim()
}

export const richTextSurfaceClassName = [
  '[&_.ProseMirror]:min-h-72 [&_.ProseMirror]:px-4 [&_.ProseMirror]:py-3 [&_.ProseMirror]:text-sm [&_.ProseMirror]:leading-7 [&_.ProseMirror]:text-foreground [&_.ProseMirror]:outline-none',
  '[&_.ProseMirror_p]:my-2 [&_.ProseMirror_h2]:mb-3 [&_.ProseMirror_h2]:mt-6 [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h3]:mb-2 [&_.ProseMirror_h3]:mt-5 [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h4]:mb-2 [&_.ProseMirror_h4]:mt-4 [&_.ProseMirror_h4]:text-lg [&_.ProseMirror_h4]:font-semibold',
  '[&_.ProseMirror_ul]:my-3 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ol]:my-3 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_li]:my-1',
  '[&_.ProseMirror_blockquote]:my-4 [&_.ProseMirror_blockquote]:border-l-2 [&_.ProseMirror_blockquote]:border-primary/40 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:text-muted-foreground',
  '[&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline [&_.ProseMirror_a]:underline-offset-4 [&_.ProseMirror_hr]:my-6 [&_.ProseMirror_hr]:border-border',
].join(' ')
