'use client'

import * as React from 'react'
import { Box, HardDrive, PlusCircle, Settings, Trash } from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@repo/ui/components/base/sidebar'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription
} from '@repo/ui/components/base/dialog'
import { Button } from '@repo/ui/components/base/button'
import { useWorkspace } from '@repo/contexts'
import { FileUpload } from './file-upload'
import { StorageQuota } from './storage-quota'
import Link from 'next/link'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [open, setOpen] = React.useState(false)
  const { currentWorkspace } = useWorkspace()

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="#">
                <Box className="!size-5" />
                <span className="text-base font-semibold">Files</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <div className="px-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="default" className="w-full" onClick={() => setOpen(true)}>
                <PlusCircle />
                <span>Upload files</span>
              </Button>
            </DialogTrigger>
            <DialogContent showCloseButton>
              <DialogTitle>Upload file</DialogTitle>
              <DialogDescription>All uploaded files are securely encrypted.</DialogDescription>
              <FileUpload onUploaded={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Files</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenuButton asChild className="flex items-center gap-2 px-2 w-full">
              <Link href="/">
                <HardDrive className="w-4 h-4" />
                <span>Home</span>
              </Link>
            </SidebarMenuButton>
            <SidebarMenuButton asChild className="flex items-center gap-2 px-2 w-full">
              <Link href="/trash">
                <Trash className="w-4 h-4" />
                <span>Trash</span>
              </Link>
            </SidebarMenuButton>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenuButton asChild className="flex items-center gap-2 px-2 w-full">
              <Link href="/settings">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <StorageQuota />
      </SidebarFooter>
    </Sidebar>
  )
}
