import { JsonController, Get, Put, UseBefore, Body, Res } from 'routing-controllers'
import type { Response } from 'express'
import { authenticate } from '../middleware/authenticate'
import { CurrentUser } from '../decorators/currentUser'
import type { User } from '@repo/types'
import { isRootAdmin } from '../utils'
import { prisma } from '../lib/prisma'
import { z } from 'zod'
import {
  sendSuccessResponse,
  sendErrorResponse,
  sendNotFoundResponse,
  sendForbiddenResponse,
  sendServerErrorResponse,
  validationSchemas
} from '../utils'

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
        return sendNotFoundResponse(res, 'User not found')
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
        return sendForbiddenResponse(
          res,
          'Forbidden: Only root administrators can access platform settings'
        )
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
        return sendSuccessResponse(res, defaultSettings)
      }

      return sendSuccessResponse(res, settings)
    } catch (err) {
      return sendServerErrorResponse(res, err)
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
        return sendNotFoundResponse(res, 'User not found')
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
        return sendForbiddenResponse(
          res,
          'Forbidden: Only root administrators can modify platform settings'
        )
      }

      // Validate the request body
      const validatedData = validationSchemas.platformSettings.parse(body)

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

      return sendSuccessResponse(res, updatedSettings)
    } catch (err) {
      return sendServerErrorResponse(res, err)
    }
  }
}
