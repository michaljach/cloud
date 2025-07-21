'use client'

import * as React from 'react'
import { LayoutDashboard, Users, Settings, HelpCircle, Box } from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@repo/ui/components/base/sidebar'
import { NavMain } from './nav-main'

const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg'
  },
  navMain: [
    {
      title: 'Home',
      url: '/',
      icon: LayoutDashboard
    },
    {
      title: 'Account settings',
      url: '/account',
      icon: Settings
    },
    {
      title: 'Team',
      url: '#',
      icon: Users
    },
    {
      title: 'Help',
      url: '#',
      icon: HelpCircle
    }
  ],
  navClouds: [],
  navSecondary: [],
  documents: []
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>v0.1</SidebarFooter>
    </Sidebar>
  )
}
