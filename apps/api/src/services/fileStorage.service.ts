import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const STORAGE_DIR = path.resolve(__dirname, '../../storage')
const ALGORITHM = 'aes-256-gcm'
const KEY = Buffer.from(process.env.FILE_ENCRYPTION_KEY || 'a'.repeat(32)) // 32 bytes

if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true })

export function encryptAndSave(fileBuffer: Buffer, filename: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv)
  const encrypted = Buffer.concat([cipher.update(fileBuffer), cipher.final()])
  const tag = cipher.getAuthTag()
  const payload = Buffer.concat([iv, tag, encrypted])
  const filePath = path.join(STORAGE_DIR, filename)
  fs.writeFileSync(filePath, payload)
  return filename
}

export function decryptAndRead(filename: string): Buffer {
  const filePath = path.join(STORAGE_DIR, filename)
  const payload = fs.readFileSync(filePath)
  const iv = payload.slice(0, 12)
  const tag = payload.slice(12, 28)
  const encrypted = payload.slice(28)
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()])
}
