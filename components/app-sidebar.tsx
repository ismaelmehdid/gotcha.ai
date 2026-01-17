'use client';

import { Camera, House, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const navigationItems: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: House },
  { name: 'Cameras', href: '/dashboard/cameras', icon: Camera },
];

const navigationFooterItems: NavigationItem[] = [
  { name: 'Logout', href: '/', icon: LogOut },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar
      collapsible="none"
      variant="inset"
      className="border-lime-400/30 bg-black/50 backdrop-blur-md"
    >
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-lime-400/20 backdrop-blur-sm border border-lime-400/40"></div>
          <span className="text-xl font-bold text-white">GOTCHA.AI</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2 px-4">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={
                        isActive
                          ? 'bg-lime-400/20 border border-lime-400/50 text-white font-medium hover:bg-lime-400/25'
                          : 'bg-white/5 border border-lime-400/20 text-white/70 hover:bg-white/10 hover:border-lime-400/40 hover:text-white'
                      }
                    >
                      <Link href={item.href}>
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="">
        <SidebarMenu className="space-y-2 px-4">
          {navigationFooterItems.map((item) => {
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  className="bg-white/5 border border-lime-400/20 text-white/70 hover:bg-white/10 hover:border-lime-400/40 hover:text-white"
                >
                  <Link href={item.href}>
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
