"use client"

import * as React from "react"
import {
  IconKey,
  IconDeviceDesktop,
  IconUsers,
  IconPackage,
  IconShield,
  IconChartBar,
  IconSettings,
  IconHelp,
  IconReportAnalytics,
  IconUsersGroup,
  IconShieldCheck,
  IconWebhook,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconChartBar,
    },
    {
      title: "Licenses",
      url: "/licenses",
      icon: IconKey,
    },
    {
      title: "Machines",
      url: "/machines", 
      icon: IconDeviceDesktop,
    },
    {
      title: "Products",
      url: "/products",
      icon: IconPackage,
    },
    {
      title: "Policies",
      url: "/policies",
      icon: IconShield,
    },
    {
      title: "Groups",
      url: "/groups",
      icon: IconUsersGroup,
    },
    {
      title: "Entitlements",
      url: "/entitlements",
      icon: IconShieldCheck,
    },
    {
      title: "Webhooks",
      url: "/webhooks",
      icon: IconWebhook,
    },
    {
      title: "Users",
      url: "/users",
      icon: IconUsers,
    },
  ],
  navSecondary: [
    {
      title: "Analytics",
      url: "/analytics",
      icon: IconReportAnalytics,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard">
                <IconKey className="!size-5" />
                <span className="text-base font-semibold">Keygen</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
