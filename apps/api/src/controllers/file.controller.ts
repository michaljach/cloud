import { Request, Response } from 'express'
import { encryptAndSave, decryptAndRead } from '../services/fileStorage.service'

/**
 * POST /api/files/upload - Upload and encrypt a file
 * @param req Express request (expects file in req.file)
 * @param res Express response
 */
export const uploadFile = (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  encryptAndSave(req.file.buffer, req.file.originalname)
  res.json({ message: 'File uploaded and encrypted', filename: req.file.originalname })
}

/**
 * GET /api/files/download/:filename - Download and decrypt a file
 * @param req Express request (expects filename in req.params)
 * @param res Express response
 */
export const downloadFile = (req: Request, res: Response) => {
  const filename = req.params.filename
  if (!filename) return res.status(400).json({ error: 'Filename is required' })
  try {
    const data = decryptAndRead(filename)
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(data)
  } catch (e) {
    res.status(404).json({ error: 'File not found or decryption failed' })
  }
}
