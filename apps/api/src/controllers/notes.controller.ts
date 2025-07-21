import { Request, Response } from 'express'
import { encryptAndSaveNote, decryptAndReadNote } from '@services/notesStorage.service'
import fs from 'fs'
import path from 'path'
import { base64urlDecode } from '@repo/utils'

export const uploadNote = (req: Request, res: Response) => {
  if (!req.file)
    return res.status(400).json({ success: false, data: null, error: 'No file uploaded' })
  const userId = (req as any).oauth?.user?.id
  if (!userId)
    return res.status(401).json({ success: false, data: null, error: 'Not authenticated' })
  encryptAndSaveNote(req.file.buffer, req.file.originalname, userId)
  res.json({
    success: true,
    data: { filename: req.file.originalname, message: 'Note uploaded and encrypted' },
    error: null
  })
}

export const downloadNote = (req: Request, res: Response) => {
  const encodedFilename = req.params.filename
  if (!encodedFilename)
    return res.status(400).json({ success: false, data: null, error: 'Filename is required' })
  const userId = (req as any).oauth?.user?.id
  if (!userId)
    return res.status(401).json({ success: false, data: null, error: 'Not authenticated' })
  try {
    const filename = base64urlDecode(encodedFilename)
    const data = decryptAndReadNote(filename, userId)
    res.setHeader('Content-Disposition', `attachment; filename="${encodedFilename}"`)
    res.send(data)
  } catch (e) {
    res
      .status(404)
      .json({ success: false, data: null, error: 'Note not found or decryption failed' })
  }
}

export const listNotes = (req: Request, res: Response) => {
  const userId = (req as any).oauth?.user?.id
  if (!userId)
    return res.status(401).json({ success: false, data: null, error: 'Not authenticated' })
  try {
    const userDir = path.resolve(__dirname, '../../storage', String(userId), 'notes')
    if (!fs.existsSync(userDir)) {
      return res.json({ success: true, data: [], error: null })
    }
    const files = fs.readdirSync(userDir).filter((f) => fs.statSync(path.join(userDir, f)).isFile())
    res.json({ success: true, data: files, error: null })
  } catch (e) {
    res.status(500).json({ success: false, data: null, error: 'Failed to list notes' })
  }
}
