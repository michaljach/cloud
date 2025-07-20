import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const STORAGE_DIR = path.resolve(__dirname, '../../storage')
const ALGORITHM = 'aes-256-gcm'
const KEY = Buffer.from('12345678901234567890123456789012') // 32 bytes

if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true })

export function encryptAndSaveUserFile(
  fileBuffer: Buffer,
  filename: string,
  userId: number
): string {
  const userDir = path.join(STORAGE_DIR, String(userId), 'files')
  if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true })
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv)
  const encrypted = Buffer.concat([cipher.update(fileBuffer), cipher.final()])
  const tag = cipher.getAuthTag()
  const payload = Buffer.concat([iv, tag, encrypted])
  const filePath = path.join(userDir, filename)
  fs.writeFileSync(filePath, payload)
  return filename
}

export function decryptAndReadUserFile(filename: string, userId: number): Buffer {
  const userDir = path.join(STORAGE_DIR, String(userId), 'files')
  const filePath = path.join(userDir, filename)
  const payload = fs.readFileSync(filePath)
  const iv = payload.slice(0, 12)
  const tag = payload.slice(12, 28)
  const encrypted = payload.slice(28)
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()])
}
