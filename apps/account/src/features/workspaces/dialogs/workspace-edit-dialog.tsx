'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { updateWorkspace } from '@repo/api'
import { useUser } from '@repo/providers'
import { Button } from '@repo/ui/components/base/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@repo/ui/components/base/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@repo/ui/components/base/form'
import { Input } from '@repo/ui/components/base/input'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import type { Workspace } from '@repo/types'

const updateWorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, 'Workspace name is required')
    .max(100, 'Name must be less than 100 characters')
})

type UpdateWorkspaceFormData = z.infer<typeof updateWorkspaceSchema>

interface WorkspaceEditDialogProps {
  workspace: Workspace | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function WorkspaceEditDialog({
  workspace,
  open,
  onOpenChange,
  onSuccess
}: WorkspaceEditDialogProps) {
  const { accessToken, refreshStorageQuota } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<UpdateWorkspaceFormData>({
    resolver: zodResolver(updateWorkspaceSchema),
    defaultValues: {
      name: ''
    }
  })

  const {
    handleSubmit,
    formState: { isSubmitting: formSubmitting },
    setError: setFormError,
    reset
  } = form

  useEffect(() => {
    if (workspace) {
      reset({
        name: workspace.name
      })
    }
  }, [workspace, reset])

  async function handleFormSubmit(values: UpdateWorkspaceFormData) {
    if (!accessToken || !workspace) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Only make the API call if the name has changed
      if (values.name !== workspace.name) {
        await updateWorkspace(accessToken, workspace.id, values.name)
        // Refresh user data to update workspace information in the UI
        await refreshStorageQuota()
        onSuccess()
        onOpenChange(false)
      } else {
        onOpenChange(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update workspace')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!workspace) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Workspace</DialogTitle>
          <DialogDescription>
            Update workspace information. Only workspace admins and root admins can edit workspaces.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workspace Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter workspace name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Workspace'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
