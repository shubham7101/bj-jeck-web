"use client";

import { Link, useLocation } from "@tanstack/react-router";
import { ChevronRight, type LucideIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const location = useLocation();

  const isRouteActive = (url: string, exact = false) => {
    if (exact) return location.pathname === url;
    return location.pathname === url || location.pathname.startsWith(`${url}/`);
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isChildActive = item.items?.some((sub) =>
            isRouteActive(sub.url),
          );
          const isOpen = item.isActive || isChildActive;
          const isMainActive = !item.items && isRouteActive(item.url, true);

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={isOpen}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                {item.items ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={isChildActive}
                        className="data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                      >
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => {
                          const isSubActive = isRouteActive(subItem.url, true); // Exact match for sub-items
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isSubActive}
                                className="data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                              >
                                <Link to={subItem.url}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : (
                  // 5. Pass isActive prop to main SidebarMenuButton
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isMainActive}
                    className="data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                  >
                    <Link to={item.url} className="flex items-center gap-2">
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
