import { Request, Response } from 'express'
import { encryptAndSaveUserFile, decryptAndReadUserFile } from '@services/filesStorage.service'

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
