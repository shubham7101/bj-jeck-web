"use client";

import {
  BookOpen,
  FileText,
  LayoutDashboard,
  MapPin,
  Package,
  Receipt,
  User,
} from "lucide-react";
import type * as React from "react";

import { NavMain } from "@/components/NavMain";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const data = {
  user: {
    name: "Manish Dhameliya",
    email: "manish1234567890@example.com",
    avatar: "",
    avatarFallback: "MD",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Customers",
      url: "/customers",
      icon: User, // Corresponds to /customers endpoints
      isActive: true,
      items: [
        {
          title: "All Customers",
          url: "/customers", // GET /customers
        },
        {
          title: "New Customer",
          url: "/customers/new", // POST /customers
        },
      ],
    },
    {
      title: "Sites",
      url: "/sites",
      icon: MapPin,
      items: [
        {
          title: "All Sites",
          url: "/sites",
        },
        {
          title: "Unbilled Sites",
          url: "/sites/unbilled",
        },
      ],
    },
    {
      title: "Records",
      url: "/records",
      icon: FileText, // Corresponds to /records endpoints
      items: [
        {
          title: "All Records",
          url: "/records", // GET /records
        },
        {
          title: "New Record",
          url: "/records/new", // POST /records
        },
      ],
    },
    {
      title: "Bills",
      url: "/bills",
      icon: Receipt, // Corresponds to /bills endpoints
      items: [
        {
          title: "All Bills",
          url: "/bills", // GET /bills
        },
        {
          title: "New Bill",
          url: "/bills/new", // POST /bills
        },
      ],
    },
    {
      title: "Ledger",
      url: "/ledger",
      icon: BookOpen, // Corresponds to /ledger endpoints
      items: [
        {
          title: "All Transactions",
          url: "/ledger", // GET /ledger
        },
        {
          title: "New Entry",
          url: "/ledger/new", // POST /ledger
        },
      ],
    },
    {
      title: "Inventory",
      url: "/inventory",
      icon: Package, // Corresponds to /inventory endpoints
      items: [
        {
          title: "Stock Overview",
          url: "/inventory", // GET /inventory
        },
        {
          title: "Update Stock",
          url: "/inventory/update", // PUT /inventory
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg bg-sidebar-primary text-sideb ar-primary-foreground flex aspect-square size-8 items-center justify-center">
                <AvatarFallback className="rounded-lg">BG</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">BG Jeck</span>
                <span className="truncate text-xs">Enterprise</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                tooltip={data.user.name}
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={data.user.avatar} alt={data.user.name} />
                  <AvatarFallback className="rounded-lg">
                    {data.user.avatarFallback || "BG"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{data.user.name}</span>
                  <span className="truncate text-xs">{data.user.email}</span>
                </div>
              </SidebarMenuButton>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
