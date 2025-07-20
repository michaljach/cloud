import { Request, Response } from 'express'
import { encryptAndSavePhoto, decryptAndReadPhoto } from '@services/photosStorage.service'

export const uploadPhoto = (req: Request, res: Response) => {
  if (!req.file)
    return res.status(400).json({ success: false, data: null, error: 'No file uploaded' })
  const userId = (req as any).oauth?.user?.id
  if (!userId)
    return res.status(401).json({ success: false, data: null, error: 'Not authenticated' })
  encryptAndSavePhoto(req.file.buffer, req.file.originalname, userId)
  res.json({
    success: true,
    data: { filename: req.file.originalname, message: 'Photo uploaded and encrypted' },
    error: null
  })
}

export const downloadPhoto = (req: Request, res: Response) => {
  const filename = req.params.filename
  if (!filename)
    return res.status(400).json({ success: false, data: null, error: 'Filename is required' })
  const userId = (req as any).oauth?.user?.id
  if (!userId)
    return res.status(401).json({ success: false, data: null, error: 'Not authenticated' })
  try {
    const data = decryptAndReadPhoto(filename, userId)
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(data)
  } catch (e) {
    res
      .status(404)
      .json({ success: false, data: null, error: 'Photo not found or decryption failed' })
  }
}
