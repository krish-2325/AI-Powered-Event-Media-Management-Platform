// src/components/layout/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  CalendarDays,
  Images,
  Search,
  Bell,
  User,
  Settings,
  Shield,
  Plus,
  ChevronLeft,
  Camera,
  UserCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store";
import { ROUTES } from "@/lib/constants";
import { hasRole } from "@/lib/auth/helpers";
import type { UserRole } from "@/lib/types/user";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
    roles: null, // available to all
  },
  {
    label: "Events",
    href: ROUTES.EVENTS,
    icon: CalendarDays,
    roles: null,
  },
  {
    label: "Gallery",
    href: ROUTES.GALLERY,
    icon: Images,
    roles: null,
  },
  {
    label: "My Photos",
    href: "/my-photos",
    icon: UserCircle2,
    roles: null,
  },
  {
    label: "Search",
    href: ROUTES.SEARCH,
    icon: Search,
    roles: null,
  },
  {
    label: "Notifications",
    href: ROUTES.NOTIFICATIONS,
    icon: Bell,
    roles: null,
  },
];

const BOTTOM_NAV_ITEMS = [
  {
    label: "Profile",
    href: ROUTES.PROFILE_SETTINGS,
    icon: Settings,
    roles: null,
  },
  {
    label: "Admin",
    href: ROUTES.ADMIN,
    icon: Shield,
    roles: ["SUPER_ADMIN", "ADMIN"] as UserRole[],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  const userRole = session?.user?.role as UserRole | undefined;

  const isActive = (href: string) => {
    if (href === ROUTES.DASHBOARD) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen bg-card border-r border-border",
        "transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 h-16 border-b border-border overflow-hidden">
        <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Camera className="w-4 h-4 text-primary-foreground" />
        </div>
        {!sidebarCollapsed && (
          <span className="font-bold text-xl font-display text-foreground tracking-tight">
            PixVault
          </span>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className={cn(
          "absolute -right-3 top-20 z-10",
          "w-6 h-6 rounded-full bg-card border border-border",
          "flex items-center justify-center",
          "text-muted-foreground hover:text-foreground",
          "transition-colors duration-200",
          "shadow-sm"
        )}
      >
        <ChevronLeft
          className={cn(
            "w-3 h-3 transition-transform duration-300",
            sidebarCollapsed && "rotate-180"
          )}
        />
      </button>

      {/* Create Event CTA */}
      {!sidebarCollapsed && session?.user && (
        <div className="p-4">
          <Link
            href={ROUTES.CREATE_EVENT}
            className={cn(
              "flex items-center gap-2 w-full px-3 py-2 rounded-lg",
              "bg-primary text-primary-foreground",
              "text-sm font-medium",
              "hover:bg-primary/90 transition-colors duration-200"
            )}
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span>New Event</span>
          </Link>
        </div>
      )}

      {sidebarCollapsed && session?.user && (
        <div className="p-2 mt-2">
          <Link
            href={ROUTES.CREATE_EVENT}
            className={cn(
              "flex items-center justify-center w-full p-2 rounded-lg",
              "bg-primary text-primary-foreground",
              "hover:bg-primary/90 transition-colors duration-200"
            )}
            title="New Event"
          >
            <Plus className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1">
        {NAV_ITEMS.map((item) => (
          <SidebarItem
            key={item.href}
            {...item}
            active={isActive(item.href)}
            collapsed={sidebarCollapsed}
          />
        ))}
      </nav>

      {/* Bottom navigation */}
      <div className="p-2 border-t border-border space-y-1">
        {BOTTOM_NAV_ITEMS.filter(
          (item) =>
            !item.roles || (userRole && hasRole(userRole, item.roles[0]))
        ).map((item) => (
          <SidebarItem
            key={item.href}
            {...item}
            active={isActive(item.href)}
            collapsed={sidebarCollapsed}
          />
        ))}

        {/* User avatar */}
        {session?.user && (
          <Link
            href={ROUTES.PROFILE(session.user.username)}
            className={cn(
              "flex items-center gap-3 p-2 rounded-lg w-full",
              "hover:bg-secondary transition-colors duration-200",
              "overflow-hidden"
            )}
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {session.user.avatarUrl ? (
                <img
                  src={session.user.avatarUrl}
                  alt={session.user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-primary" />
              )}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {session.user.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  @{session.user.username}
                </p>
              </div>
            )}
          </Link>
        )}
      </div>
    </aside>
  );
}

function SidebarItem({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg w-full",
        "text-sm font-medium transition-colors duration-200",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
        collapsed && "justify-center"
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}
