import { Request, Response } from 'express'
import { encryptAndSave, decryptAndRead } from '@services/fileStorage.service'

/**
 * POST /api/files/upload - Upload and encrypt a file
 * @param req Express request (expects file in req.file)
 * @param res Express response
 */
/**
 * Note: For file uploads, the unified response structure is always used.
 */
export const uploadFile = (req: Request, res: Response) => {
  if (!req.file)
    return res.status(400).json({ success: false, data: null, error: 'No file uploaded' })
  encryptAndSave(req.file.buffer, req.file.originalname)
  res.json({
    success: true,
    data: { filename: req.file.originalname, message: 'File uploaded and encrypted' },
    error: null
  })
}

/**
 * Note: For file downloads, the unified response structure is only used for errors. On success, raw file data is sent.
 */
export const downloadFile = (req: Request, res: Response) => {
  const filename = req.params.filename
  if (!filename)
    return res.status(400).json({ success: false, data: null, error: 'Filename is required' })
  try {
    const data = decryptAndRead(filename)
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    // For file downloads, we still return the file data directly, but for errors, use the unified structure
    res.send(data)
  } catch (e) {
    res
      .status(404)
      .json({ success: false, data: null, error: 'File not found or decryption failed' })
  }
}
