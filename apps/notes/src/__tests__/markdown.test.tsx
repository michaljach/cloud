import { extractTitleFromContent, generateFilenameFromContent } from '@/utils/markdown'

describe('extractTitleFromContent', () => {
  it('extracts first line as title', () => {
    const content = '# My Note Title\n\nThis is the content of the note.'
    expect(extractTitleFromContent(content)).toBe('My Note Title')
  })

  it('handles content with only one line', () => {
    const content = 'Single line note'
    expect(extractTitleFromContent(content)).toBe('Single line note')
  })

  it('returns "New note" for empty content', () => {
    expect(extractTitleFromContent('')).toBe('New note')
    expect(extractTitleFromContent('   ')).toBe('New note')
    expect(extractTitleFromContent('\n\n')).toBe('New note')
  })

  it('trims whitespace from title', () => {
    const content = '  My Note Title  \n\nContent here'
    expect(extractTitleFromContent(content)).toBe('My Note Title')
  })

  it('handles content with only whitespace on first line', () => {
    const content = '   \nActual content here'
    expect(extractTitleFromContent(content)).toBe('Actual content here')
  })

  it('strips markdown headers', () => {
    const content = '## My Header\n\nContent here'
    expect(extractTitleFromContent(content)).toBe('My Header')
  })

  it('strips various markdown headers', () => {
    expect(extractTitleFromContent('# Header 1\nContent')).toBe('Header 1')
    expect(extractTitleFromContent('## Header 2\nContent')).toBe('Header 2')
    expect(extractTitleFromContent('### Header 3\nContent')).toBe('Header 3')
    expect(extractTitleFromContent('#### Header 4\nContent')).toBe('Header 4')
    expect(extractTitleFromContent('##### Header 5\nContent')).toBe('Header 5')
    expect(extractTitleFromContent('###### Header 6\nContent')).toBe('Header 6')
  })

  it('strips bold and italic formatting', () => {
    expect(extractTitleFromContent('**Bold Title**\nContent')).toBe('Bold Title')
    expect(extractTitleFromContent('*Italic Title*\nContent')).toBe('Italic Title')
    expect(extractTitleFromContent('__Bold Title__\nContent')).toBe('Bold Title')
    expect(extractTitleFromContent('_Italic Title_\nContent')).toBe('Italic Title')
  })

  it('strips code formatting', () => {
    expect(extractTitleFromContent('`Code Title`\nContent')).toBe('Code Title')
    expect(extractTitleFromContent('```Code Block Title```\nContent')).toBe('Code Block Title')
  })

  it('strips links', () => {
    expect(extractTitleFromContent('[Link Text](https://example.com)\nContent')).toBe('Link Text')
    expect(extractTitleFromContent('[My Note](note.md)\nContent')).toBe('My Note')
  })

  it('strips images', () => {
    expect(extractTitleFromContent('![Alt Text](image.png)\nContent')).toBe('Alt Text')
    expect(extractTitleFromContent('![My Image](img.jpg)\nContent')).toBe('My Image')
  })

  it('strips strikethrough', () => {
    expect(extractTitleFromContent('~~Strikethrough Title~~\nContent')).toBe('Strikethrough Title')
  })

  it('strips HTML tags', () => {
    expect(extractTitleFromContent('<b>Bold Title</b>\nContent')).toBe('Bold Title')
    expect(extractTitleFromContent('<i>Italic Title</i>\nContent')).toBe('Italic Title')
    expect(extractTitleFromContent('<span>Span Title</span>\nContent')).toBe('Span Title')
  })

  it('handles complex markdown combinations', () => {
    const content = '## **Bold** and *italic* with `code` and [link](url)\nContent'
    expect(extractTitleFromContent(content)).toBe('Bold and italic with code and link')
  })

  it('handles special characters in title', () => {
    const content = 'Note with special chars: @#$%^&*()\n\nContent'
    expect(extractTitleFromContent(content)).toBe('Note with special chars: @#$%^&*()')
  })

  it('cleans up extra whitespace', () => {
    const content = '  Title   with   extra   spaces  \n\nContent'
    expect(extractTitleFromContent(content)).toBe('Title with extra spaces')
  })
})

describe('generateFilenameFromContent', () => {
  it('generates filename from simple title', () => {
    const content = 'My Note Title\n\nContent here'
    expect(generateFilenameFromContent(content)).toBe('my-note-title.md')
  })

  it('handles empty content', () => {
    expect(generateFilenameFromContent('')).toBe('new-note.md')
    expect(generateFilenameFromContent('   ')).toBe('new-note.md')
  })

  it('removes special characters', () => {
    const content = 'Note with @#$%^&*() special chars!\nContent'
    expect(generateFilenameFromContent(content)).toBe('note-with-special-chars.md')
  })

  it('handles markdown formatting', () => {
    const content = '# **Bold** and *italic* title\nContent'
    expect(generateFilenameFromContent(content)).toBe('bold-and-italic-title.md')
  })

  it('handles duplicates', () => {
    const content = 'My Note'
    const existingFilenames = ['my-note.md', 'my-note-1.md']
    expect(generateFilenameFromContent(content, existingFilenames)).toBe('my-note-2.md')
  })

  it('handles leading/trailing hyphens', () => {
    const content = '---Note Title---\nContent'
    expect(generateFilenameFromContent(content)).toBe('note-title.md')
  })

  it('handles multiple spaces and hyphens', () => {
    const content = 'Note   with---multiple   spaces\nContent'
    expect(generateFilenameFromContent(content)).toBe('note-with-multiple-spaces.md')
  })

  it('handles uppercase letters', () => {
    const content = 'UPPERCASE TITLE\nContent'
    expect(generateFilenameFromContent(content)).toBe('uppercase-title.md')
  })

  it('handles numbers', () => {
    const content = 'Note 123 with numbers\nContent'
    expect(generateFilenameFromContent(content)).toBe('note-123-with-numbers.md')
  })
})
