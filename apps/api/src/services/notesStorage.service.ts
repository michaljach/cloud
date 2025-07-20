import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { encryptAndSaveFile, decryptAndReadFile } from '../utils/cryptoStorageUtils'

const STORAGE_DIR = path.resolve(__dirname, '../../storage')
const ALGORITHM = 'aes-256-gcm'
const KEY = Buffer.from('12345678901234567890123456789012') // 32 bytes

if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true })

export function encryptAndSaveNote(fileBuffer: Buffer, filename: string, userId: number): string {
  const userDir = path.join(STORAGE_DIR, String(userId), 'notes')
  return encryptAndSaveFile({ fileBuffer, filename, dir: userDir })
}

export function decryptAndReadNote(filename: string, userId: number): Buffer {
  const userDir = path.join(STORAGE_DIR, String(userId), 'notes')
  return decryptAndReadFile({ filename, dir: userDir })
}
