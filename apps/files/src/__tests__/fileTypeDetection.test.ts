import { getFileType, isPreviewable } from '@/utils/fileTypeDetection'

describe('fileTypeDetection', () => {
  describe('getFileType', () => {
    it('should detect text files correctly', () => {
      expect(getFileType('document.txt')).toBe('text')
      expect(getFileType('README.md')).toBe('text')
      expect(getFileType('config.json')).toBe('text')
      expect(getFileType('script.js')).toBe('text')
      expect(getFileType('component.tsx')).toBe('text')
      expect(getFileType('styles.css')).toBe('text')
      expect(getFileType('data.csv')).toBe('text')
      expect(getFileType('config.yaml')).toBe('text')
    })

    it('should detect image files correctly', () => {
      expect(getFileType('photo.jpg')).toBe('image')
      expect(getFileType('image.jpeg')).toBe('image')
      expect(getFileType('screenshot.png')).toBe('image')
      expect(getFileType('animation.gif')).toBe('image')
      expect(getFileType('icon.svg')).toBe('image')
      expect(getFileType('logo.webp')).toBe('image')
      expect(getFileType('photo.tiff')).toBe('image')
    })

    it('should return other for non-text/non-image files', () => {
      expect(getFileType('document.pdf')).toBe('other')
      expect(getFileType('video.mp4')).toBe('other')
      expect(getFileType('archive.zip')).toBe('other')
      expect(getFileType('executable.exe')).toBe('other')
      expect(getFileType('file')).toBe('other')
    })

    it('should handle case insensitive extensions', () => {
      expect(getFileType('file.TXT')).toBe('text')
      expect(getFileType('image.JPG')).toBe('image')
      expect(getFileType('document.PDF')).toBe('other')
    })
  })

  describe('isPreviewable', () => {
    it('should return true for text and image files', () => {
      expect(isPreviewable('document.txt')).toBe(true)
      expect(isPreviewable('photo.jpg')).toBe(true)
      expect(isPreviewable('README.md')).toBe(true)
      expect(isPreviewable('screenshot.png')).toBe(true)
    })

    it('should return false for other file types', () => {
      expect(isPreviewable('document.pdf')).toBe(false)
      expect(isPreviewable('video.mp4')).toBe(false)
      expect(isPreviewable('archive.zip')).toBe(false)
      expect(isPreviewable('file')).toBe(false)
    })
  })
})
