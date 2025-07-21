import { formatFileSize } from '../fileSize'

describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(500)).toBe('500 B')
    expect(formatFileSize(2048)).toBe('2.0 KB')
    expect(formatFileSize(1048576)).toBe('1.0 MB')
    expect(formatFileSize(1073741824)).toBe('1.0 GB')
  })
})
