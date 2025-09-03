import { z } from 'zod'

// Common validation schemas
export const commonSchemas = {
  // User-related schemas
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().optional(),
  email: z.string().email('Invalid email format'),

  // Storage-related schemas
  storageLimitMB: z
    .number()
    .min(1, 'Storage limit must be at least 1 MB')
    .max(1000000, 'Storage limit cannot exceed 1000GB'),

  // File-related schemas
  filename: z.string().min(1, 'Filename is required'),
  filePath: z.string().min(1, 'File path is required'),
  fileSize: z.number().min(0, 'File size must be non-negative'),

  // Workspace-related schemas
  workspaceName: z.string().min(1, 'Workspace name is required'),
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  role: z.enum(['member', 'admin', 'owner']),

  // Pagination schemas
  page: z.number().min(1, 'Page must be at least 1').optional(),
  limit: z
    .number()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .optional(),

  // Search schemas
  query: z.string().min(1, 'Search query is required'),
  searchType: z.enum(['files', 'notes', 'photos']).optional()
}

// Common validation functions
export function validateParams<T>(schema: z.ZodSchema<T>, params: any): T {
  const result = schema.safeParse(params)
  if (!result.success) {
    throw new Error(result.error.issues.map((e) => e.message).join(', '))
  }
  return result.data
}

export function validateQuery<T>(schema: z.ZodSchema<T>, query: any): T {
  const result = schema.safeParse(query)
  if (!result.success) {
    throw new Error(result.error.issues.map((e) => e.message).join(', '))
  }
  return result.data
}

export function validateBody<T>(schema: z.ZodSchema<T>, body: any): T {
  const result = schema.safeParse(body)
  if (!result.success) {
    throw new Error(result.error.issues.map((e) => e.message).join(', '))
  }
  return result.data
}

// Pre-built validation schemas for common operations
export const validationSchemas = {
  // User creation
  createUser: z.object({
    username: commonSchemas.username,
    password: commonSchemas.password,
    fullName: commonSchemas.fullName,
    storageLimitMB: commonSchemas.storageLimitMB.optional()
  }),

  // User update
  updateUser: z.object({
    fullName: commonSchemas.fullName,
    storageLimitMB: commonSchemas.storageLimitMB.optional()
  }),

  // Workspace creation
  createWorkspace: z.object({
    name: commonSchemas.workspaceName
  }),

  // Workspace update
  updateWorkspace: z.object({
    name: commonSchemas.workspaceName
  }),

  // Add user to workspace
  addUserToWorkspace: z.object({
    userId: z.string().min(1, 'User ID is required'),
    role: commonSchemas.role
  }),

  // Update user role
  updateUserRole: z.object({
    role: commonSchemas.role
  }),

  // File upload
  fileUpload: z.object({
    originalname: commonSchemas.filename,
    path: commonSchemas.filePath,
    size: commonSchemas.fileSize
  }),

  // Note upload (allows 0 size for empty notes)
  noteUpload: z.object({
    originalname: commonSchemas.filename,
    path: commonSchemas.filePath,
    size: z.number().min(0, 'File size must be non-negative')
  }),

  // Search
  search: z.object({
    query: commonSchemas.query,
    type: commonSchemas.searchType
  }),

  // Pagination
  pagination: z.object({
    page: commonSchemas.page,
    limit: commonSchemas.limit
  }),

  // Platform settings
  platformSettings: z.object({
    title: z.string().min(1, 'Platform title is required'),
    timezone: z.string().min(1, 'Timezone is required'),
    maintenanceMode: z.boolean(),
    registrationEnabled: z.boolean(),
    defaultStorageLimit: z.number().min(0, 'Default storage limit must be non-negative'),
    maxFileSize: z.number().min(1, 'Max file size must be at least 1 MB'),
    supportEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
    companyName: z.string().optional().or(z.literal(''))
  }),

  // Password reset
  resetPassword: z.object({
    password: z.string().min(6, 'Password must be at least 6 characters')
  }),

  // Workspace invite creation
  createWorkspaceInvite: z.object({
    workspaceId: z.string().min(1, 'Workspace ID is required'),
    invitedUsername: z.string().min(1, 'Username is required'),
    role: z.enum(['owner', 'admin', 'member']).default('member')
  })
}
