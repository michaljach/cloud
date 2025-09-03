import type { Response } from 'express'

// Common response interface
export interface ApiResponse<T = any> {
  success: boolean
  data: T | null
  error: string | null
}

// Success response helper
export function sendSuccessResponse<T>(
  res: Response,
  data: T,
  statusCode: number = 200
): Response<ApiResponse<T>> {
  return res.status(statusCode).json({
    success: true,
    data,
    error: null
  })
}

// Error response helper
export function sendErrorResponse(
  res: Response,
  error: string,
  statusCode: number = 400
): Response<ApiResponse<null>> {
  return res.status(statusCode).json({
    success: false,
    data: null,
    error
  })
}

// Not found response helper
export function sendNotFoundResponse(
  res: Response,
  message: string = 'Resource not found'
): Response<ApiResponse<null>> {
  return sendErrorResponse(res, message, 404)
}

// Forbidden response helper
export function sendForbiddenResponse(
  res: Response,
  message: string = 'Forbidden'
): Response<ApiResponse<null>> {
  return sendErrorResponse(res, message, 403)
}

// Server error response helper
export function sendServerErrorResponse(
  res: Response,
  error: any,
  message: string = 'Internal server error'
): Response<ApiResponse<null>> {
  console.error('Server error:', error)
  return sendErrorResponse(res, message, 500)
}

// Validation error response helper
export function sendValidationErrorResponse(
  res: Response,
  error: any
): Response<ApiResponse<null>> {
  return sendErrorResponse(res, error.message || 'Validation failed', 400)
}

// Conflict response helper
export function sendConflictResponse(
  res: Response,
  message: string = 'Resource conflict'
): Response<ApiResponse<null>> {
  return sendErrorResponse(res, message, 409)
}
