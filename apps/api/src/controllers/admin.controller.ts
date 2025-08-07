import { JsonController, Get, Put, UseBefore, Body, Res } from 'routing-controllers'
import type { Response } from 'express'
import { authenticate } from '../middleware/authenticate'
import { CurrentUser } from '../decorators/currentUser'
import type { User } from '@repo/types'
import { isRootAdmin } from '../utils'
import { prisma } from '../lib/prisma'
import { z } from 'zod'
import { handleError } from '../utils/handleError'

const platformSettingsSchema = z.object({
  title: z.string().min(1, 'Platform title is required'),
  timezone: z.string().min(1, 'Timezone is required'),
  maintenanceMode: z.boolean(),
  registrationEnabled: z.boolean(),
  defaultStorageLimit: z.number().min(0, 'Default storage limit must be non-negative'),
  maxFileSize: z.number().min(1, 'Max file size must be at least 1 MB'),
  supportEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  companyName: z.string().optional().or(z.literal(''))
})

@JsonController('/admin')
@UseBefore(authenticate)
export default class AdminController {
  /**
   * GET /api/admin/settings
   * Get platform settings (root admin only)
   */
  @Get('/settings')
  async getSettings(@CurrentUser() oauthUser: User, @Res() res: Response) {
    try {
      // Fetch complete user data including workspace information
      const user = await prisma.user.findUnique({
        where: { id: oauthUser.id },
        include: {
          userWorkspaces: {
            include: {
              workspace: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      })

      if (!user) {
        return res.status(404).json({ success: false, data: null, error: 'User not found' })
      }

      // Convert to the expected User type format
      const completeUser: User = {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        storageLimit: user.storageLimit,
        workspaces: user.userWorkspaces
      }

      // Check if user is root admin
      if (!isRootAdmin(completeUser)) {
        return res.status(403).json({
          success: false,
          data: null,
          error: 'Forbidden: Only root administrators can access platform settings'
        })
      }

      const settings = await prisma.platformSettings.findUnique({
        where: { id: 'platform' }
      })

      if (!settings) {
        // Create default settings if they don't exist
        const defaultSettings = await prisma.platformSettings.create({
          data: {
            id: 'platform',
            title: 'Cloud Platform',
            timezone: 'UTC',
            maintenanceMode: false,
            registrationEnabled: true,
            defaultStorageLimit: 1024,
            maxFileSize: 100,
            supportEmail: 'support@example.com',
            companyName: 'Your Company'
          }
        })
        return res.json({ success: true, data: defaultSettings, error: null })
      }

      return res.json({ success: true, data: settings, error: null })
    } catch (err) {
      return handleError(res, err, 500)
    }
  }

  /**
   * PUT /api/admin/settings
   * Update platform settings (root admin only)
   */
  @Put('/settings')
  async updateSettings(@CurrentUser() oauthUser: User, @Body() body: any, @Res() res: Response) {
    try {
      // Fetch complete user data including workspace information
      const user = await prisma.user.findUnique({
        where: { id: oauthUser.id },
        include: {
          userWorkspaces: {
            include: {
              workspace: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      })

      if (!user) {
        return res.status(404).json({ success: false, data: null, error: 'User not found' })
      }

      // Convert to the expected User type format
      const completeUser: User = {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        storageLimit: user.storageLimit,
        workspaces: user.userWorkspaces
      }

      // Check if user is root admin
      if (!isRootAdmin(completeUser)) {
        return res.status(403).json({
          success: false,
          data: null,
          error: 'Forbidden: Only root administrators can modify platform settings'
        })
      }

      // Validate the request body
      const validatedData = platformSettingsSchema.parse(body)

      // Convert empty strings to null for optional fields
      const dataToUpdate = {
        ...validatedData,
        supportEmail: validatedData.supportEmail || null,
        companyName: validatedData.companyName || null
      }

      const updatedSettings = await prisma.platformSettings.upsert({
        where: { id: 'platform' },
        update: dataToUpdate,
        create: {
          id: 'platform',
          ...dataToUpdate
        }
      })

      return res.json({ success: true, data: updatedSettings, error: null })
    } catch (err) {
      return handleError(res, err, 500)
    }
  }
}
