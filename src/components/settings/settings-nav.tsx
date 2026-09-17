"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Code2,
  ExternalLink,
  KeyRound,
  Palette,
  ShieldCheck,
  UserCog,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  title: string;
  href: string;
  icon: React.ElementType;
  isExternal?: boolean;
  matchPrefixes?: string[];
};

const navItems: NavItem[] = [
  {
    title: "Profile",
    href: "/profile",
    icon: UserRound,
    isExternal: true,
  },
  {
    title: "Account",
    href: "/settings/account",
    icon: UserCog,
  },
  {
    title: "Appearance",
    href: "/settings/appearance",
    icon: Palette,
    matchPrefixes: ["/settings/appearance", "/settings"],
  },
  {
    title: "Notifications",
    href: "/settings/notifications",
    icon: Bell,
  },
  {
    title: "Privacy",
    href: "/settings/privacy",
    icon: ShieldCheck,
  },
  {
    title: "Developer",
    href: "/settings/developer",
    icon: Code2,
  },
  {
    title: "Security",
    href: "/settings/security",
    icon: KeyRound,
  },
];

export function SettingsNav() {
  const pathname = usePathname();

  const isItemActive = (item: NavItem) => {
    if (item.isExternal) {
      return pathname === item.href || pathname.startsWith(`${item.href}/`);
    }

    if (item.title === "Appearance") {
      return pathname === "/settings" || pathname === "/settings/appearance";
    }

    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  return (
    <nav className="w-full">
      {/* Mobile scrollable bar */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "bg-foreground text-background font-semibold"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" />
              <span>{item.title}</span>
              {item.isExternal && <ExternalLink className="size-3 opacity-60" />}
            </Link>
          );
        })}
      </div>

      {/* Desktop vertical sidebar */}
      <div className="hidden space-y-1 md:block">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-muted text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "size-4 shrink-0 transition-colors",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span>{item.title}</span>
              </div>

              {item.isExternal && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground/70">
                  <span>Edit</span>
                  <ExternalLink className="size-3" />
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
