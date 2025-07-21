'use client'

import * as React from 'react'
import { Box, PlusCircle } from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@repo/ui/components/base/sidebar'
import { Dialog, DialogTrigger, DialogContent } from '@repo/ui/components/base/dialog'
import { Button } from '@repo/ui/components/base/button'
import { FileUpload } from './file-upload'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [open, setOpen] = React.useState(false)
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="#">
                <Box className="!size-5" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <div className="px-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm" className="w-full" onClick={() => setOpen(true)}>
                <PlusCircle />
                <span>Upload files</span>
              </Button>
            </DialogTrigger>
            <DialogContent showCloseButton>
              <FileUpload onUploaded={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </SidebarContent>
      <SidebarFooter>v0.1</SidebarFooter>
    </Sidebar>
  )
}
