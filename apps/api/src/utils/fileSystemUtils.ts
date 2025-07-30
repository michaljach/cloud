import fs from 'fs'
import path from 'path'

/**
 * Ensure directory exists (synchronous)
 */
export function ensureDirSync(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

/**
 * Save file to disk (client-side encrypted data)
 */
export function saveFile({
  fileBuffer,
  filename,
  dir
}: {
  fileBuffer: Buffer
  filename: string
  dir: string
}): string {
  ensureDirSync(dir)
  const filePath = path.join(dir, filename)
  fs.writeFileSync(filePath, fileBuffer)
  return filename
}

/**
 * Read file from disk (client-side encrypted data)
 */
export function readFile({ filename, dir }: { filename: string; dir: string }): Buffer {
  const filePath = path.join(dir, filename)
  return fs.readFileSync(filePath)
}
