import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { encryptAndSaveFile, decryptAndReadFile } from '../utils/cryptoStorageUtils'

const STORAGE_DIR = path.resolve(__dirname, '../../storage')
const ALGORITHM = 'aes-256-gcm'
const KEY = Buffer.from('12345678901234567890123456789012') // 32 bytes

if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true })

export function encryptAndSaveUserFile(
  fileBuffer: Buffer,
  filename: string,
  userId: string
): string {
  const userDir = path.join(STORAGE_DIR, String(userId), 'files')
  return encryptAndSaveFile({ fileBuffer, filename, dir: userDir })
}

export function decryptAndReadUserFile(filename: string, userId: string): Buffer {
  const userDir = path.join(STORAGE_DIR, String(userId), 'files')
  return decryptAndReadFile({ filename, dir: userDir })
}
