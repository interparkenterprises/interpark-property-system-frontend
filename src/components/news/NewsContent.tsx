'use client'

import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { normalizeNewsContent, richTextSurfaceClassName } from './rich-text'

export function NewsContent({ content }: { content: string }) {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: normalizeNewsContent(content),
    editable: false,
    immediatelyRender: false,
  })

  if (!editor) return <div className="min-h-24" aria-hidden="true" />

  return <EditorContent editor={editor} className={`${richTextSurfaceClassName} [&_.ProseMirror]:min-h-0 [&_.ProseMirror]:p-0 [&_.ProseMirror]:text-base`} />
}
