'use client'

import { useState } from 'react'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import {
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  UnderlineIcon,
  Undo2,
  Unlink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Toggle } from '@/components/ui/toggle'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { normalizeNewsContent, richTextSurfaceClassName } from './rich-text'

interface NewsRichTextEditorProps {
  value: string
  onChange: (value: string) => void
  error?: string
}

function ToolbarTooltip({ label, children }: { label: string; children: React.ReactElement }) {
  return <Tooltip><TooltipTrigger asChild>{children}</TooltipTrigger><TooltipContent>{label}</TooltipContent></Tooltip>
}

function normalizeLink(value: string) {
  const url = value.trim()
  if (!url) return ''
  if (/^(https?:\/\/|mailto:|tel:)/i.test(url)) return url
  return `https://${url}`
}

export function NewsRichTextEditor({ value, onChange, error }: NewsRichTextEditorProps) {
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } },
      }),
      Underline,
    ],
    content: normalizeNewsContent(value),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        'aria-label': 'Announcement content',
      },
    },
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.isEmpty ? '' : currentEditor.getHTML()),
  })

  const state = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      bold: currentEditor?.isActive('bold') ?? false,
      italic: currentEditor?.isActive('italic') ?? false,
      underline: currentEditor?.isActive('underline') ?? false,
      strike: currentEditor?.isActive('strike') ?? false,
      bulletList: currentEditor?.isActive('bulletList') ?? false,
      orderedList: currentEditor?.isActive('orderedList') ?? false,
      blockquote: currentEditor?.isActive('blockquote') ?? false,
      link: currentEditor?.isActive('link') ?? false,
      heading: currentEditor?.isActive('heading', { level: 2 }) ? 'h2' : currentEditor?.isActive('heading', { level: 3 }) ? 'h3' : currentEditor?.isActive('heading', { level: 4 }) ? 'h4' : 'paragraph',
      canUndo: currentEditor?.can().chain().focus().undo().run() ?? false,
      canRedo: currentEditor?.can().chain().focus().redo().run() ?? false,
    }),
  })

  if (!editor) return <div className="h-80 animate-pulse rounded-md border border-border bg-muted" aria-hidden="true" />

  const toolbarState = state ?? {
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    bulletList: false,
    orderedList: false,
    blockquote: false,
    link: false,
    heading: 'paragraph',
    canUndo: false,
    canRedo: false,
  }

  const applyHeading = (next: string) => {
    if (next === 'paragraph') editor.chain().focus().setParagraph().run()
    else editor.chain().focus().setHeading({ level: Number(next.slice(1)) as 2 | 3 | 4 }).run()
  }

  const applyList = (next: string) => {
    if (next === 'bulletList') editor.chain().focus().toggleBulletList().run()
    else if (next === 'orderedList') editor.chain().focus().toggleOrderedList().run()
    else if (toolbarState.bulletList) editor.chain().focus().toggleBulletList().run()
    else if (toolbarState.orderedList) editor.chain().focus().toggleOrderedList().run()
  }

  const applyLink = () => {
    const href = normalizeLink(linkUrl)
    if (!href) return
    editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
    setLinkOpen(false)
  }

  return (
    <div className="space-y-1.5">
      <Label required>Content</Label>
      <div className={cn('overflow-hidden rounded-md border border-input bg-background shadow-xs focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/25', error && 'border-destructive focus-within:border-destructive focus-within:ring-destructive/20')}>
        <TooltipProvider delayDuration={400}>
          <div role="toolbar" aria-label="Announcement formatting" className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/35 p-2">
            <Select value={toolbarState.heading} onValueChange={applyHeading}>
              <SelectTrigger className="h-8 w-32 border-0 bg-transparent shadow-none" aria-label="Text style"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="paragraph">Paragraph</SelectItem><SelectItem value="h2">Heading 2</SelectItem><SelectItem value="h3">Heading 3</SelectItem><SelectItem value="h4">Heading 4</SelectItem></SelectContent>
            </Select>
            <Separator orientation="vertical" className="mx-1 h-6" />

            <ToolbarTooltip label="Bold"><Toggle size="sm" pressed={toolbarState.bold} onPressedChange={() => editor.chain().focus().toggleBold().run()} aria-label="Toggle bold"><Bold /></Toggle></ToolbarTooltip>
            <ToolbarTooltip label="Italic"><Toggle size="sm" pressed={toolbarState.italic} onPressedChange={() => editor.chain().focus().toggleItalic().run()} aria-label="Toggle italic"><Italic /></Toggle></ToolbarTooltip>
            <ToolbarTooltip label="Underline"><Toggle size="sm" pressed={toolbarState.underline} onPressedChange={() => editor.chain().focus().toggleUnderline().run()} aria-label="Toggle underline"><UnderlineIcon /></Toggle></ToolbarTooltip>
            <ToolbarTooltip label="Strikethrough"><Toggle size="sm" pressed={toolbarState.strike} onPressedChange={() => editor.chain().focus().toggleStrike().run()} aria-label="Toggle strikethrough"><Strikethrough /></Toggle></ToolbarTooltip>
            <Separator orientation="vertical" className="mx-1 h-6" />

            <ToggleGroup type="single" size="sm" value={toolbarState.bulletList ? 'bulletList' : toolbarState.orderedList ? 'orderedList' : ''} onValueChange={applyList} aria-label="List formatting">
              <ToolbarTooltip label="Bulleted list"><ToggleGroupItem value="bulletList" aria-label="Toggle bulleted list"><List /></ToggleGroupItem></ToolbarTooltip>
              <ToolbarTooltip label="Numbered list"><ToggleGroupItem value="orderedList" aria-label="Toggle numbered list"><ListOrdered /></ToggleGroupItem></ToolbarTooltip>
            </ToggleGroup>
            <ToolbarTooltip label="Blockquote"><Toggle size="sm" pressed={toolbarState.blockquote} onPressedChange={() => editor.chain().focus().toggleBlockquote().run()} aria-label="Toggle blockquote"><Quote /></Toggle></ToolbarTooltip>
            <Separator orientation="vertical" className="mx-1 h-6" />

            <Popover open={linkOpen} onOpenChange={(open) => { setLinkOpen(open); if (open) setLinkUrl(editor.getAttributes('link').href ?? '') }}>
              <ToolbarTooltip label="Edit link"><PopoverTrigger asChild><Button type="button" size="icon" variant={toolbarState.link ? 'secondary' : 'ghost'} className="h-8 w-8" aria-label="Edit link"><LinkIcon /></Button></PopoverTrigger></ToolbarTooltip>
              <PopoverContent align="start">
                <div className="space-y-3">
                  <Input label="Link URL" value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https://example.com" onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); applyLink() } }} />
                  <div className="flex justify-end gap-2">
                    {toolbarState.link && <Button type="button" variant="outline" size="sm" onClick={() => { editor.chain().focus().unsetLink().run(); setLinkOpen(false) }}><Unlink />Remove</Button>}
                    <Button type="button" size="sm" onClick={applyLink}>Apply link</Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <ToolbarTooltip label="Horizontal rule"><Button type="button" size="icon" variant="ghost" className="h-8 w-8" aria-label="Insert horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus /></Button></ToolbarTooltip>
            <Separator orientation="vertical" className="mx-1 h-6" />
            <ToolbarTooltip label="Undo"><Button type="button" size="icon" variant="ghost" className="h-8 w-8" aria-label="Undo" disabled={!toolbarState.canUndo} onClick={() => editor.chain().focus().undo().run()}><Undo2 /></Button></ToolbarTooltip>
            <ToolbarTooltip label="Redo"><Button type="button" size="icon" variant="ghost" className="h-8 w-8" aria-label="Redo" disabled={!toolbarState.canRedo} onClick={() => editor.chain().focus().redo().run()}><Redo2 /></Button></ToolbarTooltip>
          </div>
        </TooltipProvider>
        <EditorContent editor={editor} className={richTextSurfaceClassName} />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
