import { getEncryptionKeyBuffer } from '@repo/utils'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

export const ALGORITHM = 'aes-256-gcm'

/**
 * Ensure directory exists (synchronous)
 */
export function ensureDirSync(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

/**
 * Encrypt and save file to disk
 */
export function encryptAndSaveFile({
  fileBuffer,
  filename,
  dir,
  key = getEncryptionKeyBuffer()
}: {
  fileBuffer: Buffer
  filename: string
  dir: string
  key?: Buffer
}): string {
  ensureDirSync(dir)
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(fileBuffer), cipher.final()])
  const tag = cipher.getAuthTag()
  const payload = Buffer.concat([iv, tag, encrypted])
  const filePath = path.join(dir, filename)
  fs.writeFileSync(filePath, payload)
  return filename
}

/**
 * Decrypt and read file from disk
 */
export function decryptAndReadFile({
  filename,
  dir,
  key = getEncryptionKeyBuffer()
}: {
  filename: string
  dir: string
  key?: Buffer
}): Buffer {
  const filePath = path.join(dir, filename)
  const payload = fs.readFileSync(filePath)
  const iv = payload.slice(0, 12)
  const tag = payload.slice(12, 28)
  const encrypted = payload.slice(28)
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()])
}
