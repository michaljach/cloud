import { Response } from 'express'

/**
 * Centralized error handler for API responses
 * @param res Express response
 * @param error Error object or string
 * @param status HTTP status code (default 400)
 */
export function handleError(res: Response, error: any, status = 400) {
  const message = typeof error === 'string' ? error : error?.message || 'Unknown error'
  res.status(status).json({ success: false, data: null, error: message })
}
