export interface StorageQuotaData {
  totalUsage: { bytes: number; megabytes: number }
  breakdown: {
    files: { bytes: number; megabytes: number }
    notes: { bytes: number; megabytes: number }
    photos: { bytes: number; megabytes: number }
  }
}

export interface FileInfo {
  filename: string
  size: number
  modified: Date
}

export interface FolderOrFileInfo {
  name: string
  type: 'file' | 'folder'
  size?: number
  modified: Date
}

export interface TrashedFileInfo extends FileInfo {
  type: 'file' | 'folder'
}
