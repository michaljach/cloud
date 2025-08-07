'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useUser } from '@repo/providers'
import { Button } from '@repo/ui/components/base/button'
import { Input } from '@repo/ui/components/base/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@repo/ui/components/base/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@repo/ui/components/base/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@repo/ui/components/base/select'
import { Switch } from '@repo/ui/components/base/switch'
import { toast } from 'sonner'
import { Separator } from '@repo/ui/components/base/separator'
import { AdminSettingsProvider, useAdminSettings } from '../providers/admin-settings-provider'

// Utility function to check if user is root admin
const SYSTEM_ADMIN_WORKSPACE_ID = 'system-admin-workspace'

interface UserWorkspace {
  role: string
  workspace: {
    id: string
  }
}

interface UserWithWorkspaces {
  workspaces?: UserWorkspace[]
}

function isRootAdmin(user: UserWithWorkspaces | null): boolean {
  return (
    user?.workspaces?.some(
      (uw) => uw.role === 'owner' && uw.workspace.id === SYSTEM_ADMIN_WORKSPACE_ID
    ) ?? false
  )
}

// Zod schema for form validation
const platformSettingsSchema = z.object({
  title: z.string().min(1, 'Platform title is required'),
  timezone: z.string().min(1, 'Timezone is required'),
  maintenanceMode: z.boolean(),
  registrationEnabled: z.boolean(),
  defaultStorageLimit: z.number().min(1, 'Storage limit must be at least 1 MB'),
  maxFileSize: z.number().min(1, 'Max file size must be at least 1 MB'),
  supportEmail: z.string().email('Invalid email address').or(z.literal('')),
  companyName: z.string()
})

type PlatformSettingsForm = z.infer<typeof platformSettingsSchema>

function AdminSettingsContent() {
  const { user, loading, accessToken } = useUser()
  const { settings, isLoading, error, updateSettings } = useAdminSettings()

  // Check if user is root admin
  const userIsRootAdmin = user ? isRootAdmin(user) : false

  const form = useForm<PlatformSettingsForm>({
    resolver: zodResolver(platformSettingsSchema),
    defaultValues: {
      title: '',
      timezone: 'UTC',
      maintenanceMode: false,
      registrationEnabled: true,
      defaultStorageLimit: 1024,
      maxFileSize: 100,
      supportEmail: '',
      companyName: ''
    }
  })

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting }
  } = form

  useEffect(() => {
    if (settings) {
      reset({
        title: settings.title,
        timezone: settings.timezone,
        maintenanceMode: settings.maintenanceMode,
        registrationEnabled: settings.registrationEnabled,
        defaultStorageLimit: settings.defaultStorageLimit,
        maxFileSize: settings.maxFileSize,
        supportEmail: settings.supportEmail || '',
        companyName: settings.companyName || ''
      })
    }
  }, [settings, reset])

  const onSubmit = async (data: PlatformSettingsForm) => {
    if (!accessToken) return

    try {
      await updateSettings(data)
      toast.success('Platform settings updated successfully')
    } catch {
      toast.error('Failed to update platform settings')
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  // Show loading if user data hasn't loaded yet
  if (!user && !loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    )
  }

  if (user && !userIsRootAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don&apos;t have permission to access platform settings. Only root administrators
              can manage platform settings.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const timezones = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney'
  ]

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Platform Settings</h1>
        <p className="text-muted-foreground">Configure global platform settings and preferences</p>
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic platform configuration and branding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Platform Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="My Cloud Platform" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Your Company Name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Timezone</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {timezones.map((tz) => (
                            <SelectItem key={tz} value={tz}>
                              {tz}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="supportEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Support Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="support@yourcompany.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* System Settings */}
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>System behavior and operational settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="maintenanceMode"
                render={({ field }) => (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Maintenance Mode</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Enable to prevent users from accessing the platform
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </div>
                )}
              />
              <Separator />
              <FormField
                control={form.control}
                name="registrationEnabled"
                render={({ field }) => (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>User Registration</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Allow new users to register accounts
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </div>
                )}
              />
            </CardContent>
          </Card>

          {/* Storage Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Storage Settings</CardTitle>
              <CardDescription>Configure storage limits and file upload settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="defaultStorageLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Storage Limit (MB)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="1"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxFileSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max File Size (MB)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="1"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

export function AdminSettingsClient() {
  return (
    <AdminSettingsProvider>
      <AdminSettingsContent />
    </AdminSettingsProvider>
  )
}
