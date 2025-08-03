export function getFileType(filename: string): 'text' | 'image' | 'other' {
  const extension = filename.toLowerCase().split('.').pop() || ''

  // Text file extensions
  const textExtensions = [
    'txt',
    'md',
    'json',
    'js',
    'ts',
    'jsx',
    'tsx',
    'html',
    'css',
    'scss',
    'xml',
    'csv',
    'log',
    'ini',
    'conf',
    'yaml',
    'yml'
  ]

  // Image file extensions
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'tif']

  if (textExtensions.includes(extension)) {
    return 'text'
  }

  if (imageExtensions.includes(extension)) {
    return 'image'
  }

  return 'other'
}

export function isPreviewable(filename: string): boolean {
  const fileType = getFileType(filename)
  return fileType === 'text' || fileType === 'image'
}
