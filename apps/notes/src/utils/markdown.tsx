import React from 'react'

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
