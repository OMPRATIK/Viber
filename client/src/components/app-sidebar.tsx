import {
  Activity,
  Bookmark,
  Briefcase,
  Calendar,
  ChartNoAxesColumn,
  Folder,
  Home,
  Inbox,
  Library,
  Search,
  Settings,
  Settings2,
} from "lucide-react";

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
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { SidebarOptInForm } from "./sidebar-opt-in";

// Menu items.
const application = [
  {
    title: "Stories",
    url: "#",
    icon: Library,
  },
  {
    title: "Showcase",
    url: "#",
    icon: Folder,
  },
  {
    title: "Jobs",
    url: "#",
    icon: Briefcase,
  },
  {
    title: "Leaderboard",
    url: "#",
    icon: ChartNoAxesColumn,
  },
];

const profile = [
  {
    title: "Activity",
    url: "#",
    icon: Activity,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings2,
  },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <a href="#" className="flex items-center gap-2.5 p-2">
          <img src="logo.svg" alt="Logo" className="size-7" />
          <span className="text-3xl">Viber</span>
        </a>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {application.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Profile</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {profile.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarOptInForm />
      </SidebarFooter>
    </Sidebar>
  );
}
