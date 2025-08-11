import React from 'react'

/**
 * Extract the first line of content as a title
 * If content is empty or only whitespace, returns "New note"
 * Strips markdown formatting to provide clean text
 */
export function extractTitleFromContent(content: string): string {
  const lines = content.split('\n')

  // Find the first non-empty line
  for (const line of lines) {
    const trimmedLine = line.trim()
    if (trimmedLine) {
      return stripMarkdown(trimmedLine)
    }
  }

  // If no non-empty lines found, return "New note"
  return 'New note'
}

/**
 * Generate a safe filename from content
 * If content is empty, returns "new-note.md"
 * Handles duplicates by appending numbers
 */
export function generateFilenameFromContent(
  content: string,
  existingFilenames: string[] = []
): string {
  const title = extractTitleFromContent(content)

  // Convert title to safe filename
  let safeFilename = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens

  // If empty after sanitization, use default
  if (!safeFilename) {
    safeFilename = 'new-note'
  }

  // Add .md extension
  let filename = `${safeFilename}.md`

  // Handle duplicates
  let counter = 1
  while (existingFilenames.includes(filename)) {
    filename = `${safeFilename}-${counter}.md`
    counter++
  }

  return filename
}

/**
 * Strip markdown formatting from text
 */
function stripMarkdown(text: string): string {
  return (
    text
      // Remove markdown headers (# ## ### etc.)
      .replace(/^#{1,6}\s+/, '')
      // Remove inline images ![alt](url) -> alt (do this before links)
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      // Remove links [text](url) -> text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove code blocks ```code``` -> code
      .replace(/```([^`]+)```/g, '$1')
      // Remove inline code `code` -> code
      .replace(/`([^`]+)`/g, '$1')
      // Remove bold/italic markers (** or __ or * or _)
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      // Remove strikethrough ~~text~~ -> text
      .replace(/~~(.*?)~~/g, '$1')
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Clean up extra whitespace
      .replace(/\s+/g, ' ')
      .trim()
  )
}

export function parseMarkdown(md: string): React.ReactNode {
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

export function parseInline(text: string): React.ReactNode[] {
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
