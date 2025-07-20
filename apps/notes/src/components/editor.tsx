'use client'

import React, { useState } from 'react'
import { uploadEncryptedNote } from '@repo/api/src/api'
import { useUser } from '@repo/auth'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@repo/ui/components/base/card'
import { Input } from '@repo/ui/components/base/input'
import { Toggle } from '@repo/ui/components/base/toggle'
import { Label } from '@repo/ui/components/base/label'
import { SidebarClose, SidebarOpenIcon } from 'lucide-react'
import { Button } from '@repo/ui/components/base/button'

// Remove fetchSalt, deriveKey, and password usage
// Add hardcoded key
const HARDCODED_KEY = new TextEncoder().encode('12345678901234567890123456789012') // 32 bytes

// Helper: encrypt file using WebCrypto
async function encryptFile(file: File, key: Uint8Array): Promise<Uint8Array> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'AES-GCM' }, false, [
    'encrypt'
  ])
  const fileBuffer = await file.arrayBuffer()
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, fileBuffer)
  // Concatenate iv + encrypted
  const result = new Uint8Array(iv.length + encrypted.byteLength)
  result.set(iv, 0)
  result.set(new Uint8Array(encrypted), iv.length)
  return result
}

function FileUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const { accessToken } = useUser()

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !accessToken) {
      setStatus('File and login required')
      return
    }
    setStatus('Encrypting...')
    try {
      const encrypted = await encryptFile(file, HARDCODED_KEY)
      setStatus('Uploading...')
      await uploadEncryptedNote(encrypted, file.name, accessToken)
      setStatus('Upload successful!')
    } catch (err: any) {
      setStatus('Error: ' + err.message)
    }
  }

  return (
    <Card className="max-w-xl w-full mx-auto mb-4">
      <CardHeader>
        <CardTitle>Upload Encrypted Note</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form onSubmit={handleUpload} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="file-upload">File</Label>
            <Input
              id="file-upload"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <Button type="submit">Upload Encrypted Note</Button>
          {status && <div className="text-sm text-muted-foreground">{status}</div>}
        </form>
      </CardContent>
      <CardFooter />
    </Card>
  )
}

export { FileUpload }

function parseMarkdown(md: string): React.ReactNode {
  const lines = md.split(/\r?\n/)
  const elements: React.ReactNode[] = []
  let listItems: React.ReactNode[] = []
  let inList = false
  let ulCount = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ''
    let matched = false
    switch (true) {
      case line.startsWith('###### '):
        elements.push(<h6 key={i}>{parseInline(line.slice(7))}</h6>)
        matched = true
        break
      case line.startsWith('##### '):
        elements.push(<h5 key={i}>{parseInline(line.slice(6))}</h5>)
        matched = true
        break
      case line.startsWith('#### '):
        elements.push(<h4 key={i}>{parseInline(line.slice(5))}</h4>)
        matched = true
        break
      case line.startsWith('### '):
        elements.push(<h3 key={i}>{parseInline(line.slice(4))}</h3>)
        matched = true
        break
      case line.startsWith('## '):
        elements.push(<h2 key={i}>{parseInline(line.slice(3))}</h2>)
        matched = true
        break
      case line.startsWith('# '):
        elements.push(
          <h1 className="text-4xl font-extrabold tracking-tight text-balance" key={i}>
            {parseInline(line.slice(2))}
          </h1>
        )
        matched = true
        break
      case line.startsWith('> '):
        elements.push(<blockquote key={i}>{parseInline(line.slice(2))}</blockquote>)
        matched = true
        break
      case line.startsWith('- '):
        inList = true
        listItems.push(<li key={i}>{parseInline(line.slice(2))}</li>)
        matched = true
        break
      default:
        if (inList) {
          elements.push(
            <ul className="list-disc pl-6 space-y-1" key={`ul-${ulCount++}`}>
              {listItems}
            </ul>
          )
          listItems = []
          inList = false
        }
        if (line.trim() === '') {
          elements.push(<br key={i} />)
        } else {
          elements.push(<p key={i}>{parseInline(line)}</p>)
        }
    }
    if (matched) continue
  }
  if (inList && listItems.length > 0) {
    elements.push(
      <ul className="list-disc pl-6 space-y-1" key={`ul-${ulCount++}`}>
        {listItems}
      </ul>
    )
  }
  return elements
}

function parseInline(text: string): React.ReactNode[] {
  const result: React.ReactNode[] = []
  let remaining = text
  let key = 0
  const patterns = [
    { regex: /`([^`]+)`/, render: (m: RegExpMatchArray) => <code key={key++}>{m[1]}</code> },
    { regex: /\*\*(.+?)\*\*/, render: (m: RegExpMatchArray) => <b key={key++}>{m[1]}</b> },
    { regex: /\*(.+?)\*/, render: (m: RegExpMatchArray) => <i key={key++}>{m[1]}</i> },
    {
      regex: /\[(.+?)\]\((.+?)\)/,
      render: (m: RegExpMatchArray) => (
        <a key={key++} href={m[2]} target="_blank" rel="noopener noreferrer">
          {m[1]}
        </a>
      )
    }
  ]
  while (remaining.length > 0) {
    let matched = false
    for (const { regex, render } of patterns) {
      const match = remaining.match(regex)
      if (match && match.index !== undefined) {
        if (match.index > 0) {
          result.push(remaining.slice(0, match.index))
        }
        result.push(render(match))
        remaining = remaining.slice(match.index + match[0].length)
        matched = true
        break
      }
    }
    if (!matched) {
      result.push(remaining)
      break
    }
  }
  return result
}

export function Editor({
  value: controlledValue,
  onChange
}: { value?: string; onChange?: (v: string) => void } = {}) {
  const [value, setValue] = useState<string>(controlledValue ?? '')
  const [open, setOpen] = useState(true)

  React.useEffect(() => {
    if (controlledValue !== undefined) setValue(controlledValue)
  }, [controlledValue])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    onChange?.(e.target.value)
  }

  return (
    <div className="flex w-full h-full min-h-0 flex-col">
      <div className="flex items-center justify-end p-2 gap-2 border-b">
        <Toggle
          pressed={open}
          onPressedChange={setOpen}
          variant="default"
          size="sm"
          aria-label={open ? 'Hide Preview' : 'Show Preview'}
          className="px-3 py-1"
        >
          {open ? <SidebarOpenIcon /> : <SidebarClose />}
        </Toggle>
      </div>
      <div className="flex w-full h-full min-h-0 overflow-hidden">
        <textarea
          className={`h-full min-h-0 p-4 border-r resize-none outline-none font-mono text-base bg-background transition-all duration-300 ${open ? 'w-1/2' : 'w-full'}`}
          style={{ height: '100%', minHeight: 0 }}
          value={value}
          onChange={handleChange}
          placeholder="Write your markdown here..."
          spellCheck={false}
        />
        <div
          className={`h-full min-h-0 p-4 prose dark:prose-invert bg-background overflow-auto transition-all duration-300 ${open ? 'w-1/2 opacity-100' : 'w-0 opacity-0 pointer-events-none'}`}
          style={{ height: '100%', minHeight: 0 }}
        >
          {parseMarkdown(value)}
        </div>
      </div>
    </div>
  )
}
