'use client'

import * as React from 'react'
import {
  Camera,
  ChartBar,
  LayoutDashboard,
  Database,
  Folder,
  Users,
  ListOrdered,
  File,
  FileArchive,
  Settings,
  HelpCircle,
  Search,
  FileAudioIcon,
  Text,
  Box
} from 'lucide-react'

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
      title: 'Dashboard',
      url: '#',
      icon: LayoutDashboard
    },
    {
      title: 'Lifecycle',
      url: '#',
      icon: ListOrdered
    },
    {
      title: 'Analytics',
      url: '#',
      icon: ChartBar
    },
    {
      title: 'Projects',
      url: '#',
      icon: Folder
    },
    {
      title: 'Team',
      url: '#',
      icon: Users
    }
  ],
  navClouds: [
    {
      title: 'Capture',
      icon: Camera,
      isActive: true,
      url: '#',
      items: [
        {
          title: 'Active Proposals',
          url: '#'
        },
        {
          title: 'Archived',
          url: '#'
        }
      ]
    },
    {
      title: 'Proposal',
      icon: File,
      url: '#',
      items: [
        {
          title: 'Active Proposals',
          url: '#'
        },
        {
          title: 'Archived',
          url: '#'
        }
      ]
    },
    {
      title: 'Prompts',
      icon: FileArchive,
      url: '#',
      items: [
        {
          title: 'Active Proposals',
          url: '#'
        },
        {
          title: 'Archived',
          url: '#'
        }
      ]
    }
  ],
  navSecondary: [
    {
      title: 'Settings',
      url: '#',
      icon: Settings
    },
    {
      title: 'Get Help',
      url: '#',
      icon: HelpCircle
    },
    {
      title: 'Search',
      url: '#',
      icon: Search
    }
  ],
  documents: [
    {
      name: 'Data Library',
      url: '#',
      icon: Database
    },
    {
      name: 'Reports',
      url: '#',
      icon: FileAudioIcon
    },
    {
      name: 'Word Assistant',
      url: '#',
      icon: Text
    }
  ]
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
