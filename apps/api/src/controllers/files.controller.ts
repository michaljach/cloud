import { Request, Response } from 'express'
import { encryptAndSaveUserFile, decryptAndReadUserFile } from '@services/filesStorage.service'
import fs from 'fs'
import path from 'path'

export const uploadUserFile = (req: Request, res: Response) => {
  if (!req.file)
    return res.status(400).json({ success: false, data: null, error: 'No file uploaded' })
  const userId = (req as any).oauth?.user?.id
  if (!userId)
    return res.status(401).json({ success: false, data: null, error: 'Not authenticated' })
  encryptAndSaveUserFile(req.file.buffer, req.file.originalname, userId)
  res.json({
    success: true,
    data: { filename: req.file.originalname, message: 'File uploaded and encrypted' },
    error: null
  })
}

export const downloadUserFile = (req: Request, res: Response) => {
  const filename = req.params.filename
  if (!filename)
    return res.status(400).json({ success: false, data: null, error: 'Filename is required' })
  const userId = (req as any).oauth?.user?.id
  if (!userId)
    return res.status(401).json({ success: false, data: null, error: 'Not authenticated' })
  try {
    const data = decryptAndReadUserFile(filename, userId)
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(data)
  } catch (e) {
    res
      .status(404)
      .json({ success: false, data: null, error: 'File not found or decryption failed' })
  }
}

export const listUserFiles = (req: Request, res: Response) => {
  const userId = (req as any).oauth?.user?.id
  if (!userId)
    return res.status(401).json({ success: false, data: null, error: 'Not authenticated' })
  try {
    const userDir = path.resolve(__dirname, '../../storage', String(userId), 'files')
    if (!fs.existsSync(userDir)) {
      return res.json({ success: true, data: [], error: null })
    }
    const files = fs
      .readdirSync(userDir)
      .filter((f) => fs.statSync(path.join(userDir, f)).isFile())
      .map((f) => ({ filename: f, size: fs.statSync(path.join(userDir, f)).size }))
    res.json({ success: true, data: files, error: null })
  } catch (e) {
    res.status(500).json({ success: false, data: null, error: 'Failed to list files' })
  }
}
