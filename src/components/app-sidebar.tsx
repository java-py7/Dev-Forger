"use client";

import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

import {
  Bell,
  ChevronUp,
  Code2,
  Compass,
  FolderKanban,
  KanbanSquare,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Rocket,
  Settings,
  UserRound,
  Users,
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

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type AppSidebarProps = {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
};

const mainNavigation = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Discover", href: "/discover", icon: Compass },
  { title: "Projects", href: "/projects", icon: FolderKanban },
  { title: "Teams", href: "/teams", icon: Users },
  { title: "Kanban", href: "/kanban", icon: KanbanSquare },
  { title: "Chat", href: "/chat", icon: MessageSquare },
];

const workspaceNavigation = [
  { title: "Code", href: "/workspace", icon: Code2 },
  { title: "Deployments", href: "/deployments", icon: Rocket },
];

const secondaryNavigation = [
  { title: "Notifications", href: "/notifications", icon: Bell },
  { title: "Settings", href: "/settings", icon: Settings },
];

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const initials =
    user.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ||
    user.email?.slice(0, 2).toUpperCase() ||
    "DF";

  const navigate = (href: string) => {
    router.push(href);
  };

  const renderNavigation = (
    items:
      | typeof mainNavigation
      | typeof workspaceNavigation
      | typeof secondaryNavigation,
  ) => (
    <SidebarMenu>
      {items.map((item) => {
        const Icon = item.icon;

        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href ||
            pathname.startsWith(`${item.href}/`);

        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              tooltip={item.title}
              onClick={() => navigate(item.href)}
              className={`h-10 cursor-pointer rounded-lg border px-3 transition-colors !bg-transparent ${active
                ? "border-white/25"
                : "border-transparent hover:border-white/25"
                } group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0`}
            >
              <Icon className="size-4 shrink-0" />

              <span className="group-data-[collapsible=icon]:hidden">
                {item.title}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );

  const profileActive =
    pathname === "/profile" || pathname.startsWith("/profile/");

  return (
    <Sidebar
      collapsible="icon"
      variant="inset"
      className="border-r-0 transition-[width] duration-300 ease-out"
    >
      <SidebarHeader className="px-3 pt-2 group-data-[collapsible=icon]:px-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="DevForge"
              onClick={() => navigate("/")}
              className="h-12 cursor-pointer rounded-xl px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
                <Code2 className="size-[17px]" />
              </div>

              <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-semibold">
                  DevForge
                </span>

                <span className="truncate text-[11px] text-muted-foreground">
                  Developer workspace
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-3 py-3 group-data-[collapsible=icon]:px-2">
        <SidebarGroup className="px-0">
          <SidebarGroupLabel className="mb-1 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            Platform
          </SidebarGroupLabel>

          <SidebarGroupContent>
            {renderNavigation(mainNavigation)}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4 px-0">
          <SidebarGroupLabel className="mb-1 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            Workspace
          </SidebarGroupLabel>

          <SidebarGroupContent>
            {renderNavigation(workspaceNavigation)}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4 px-0">
          <SidebarGroupLabel className="mb-1 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            General
          </SidebarGroupLabel>

          <SidebarGroupContent>
            {renderNavigation(secondaryNavigation)}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-3 pb-2 group-data-[collapsible=icon]:px-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border p-2 text-left text-sm outline-none transition-colors !bg-transparent ${profileActive
                  ? "border-white/25"
                  : "border-transparent hover:border-white/25"
                  } group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:p-0`}
              >
                <Avatar className="size-9 shrink-0 rounded-lg">
                  <AvatarImage
                    src={user.image ?? undefined}
                    alt={user.name ?? "User"}
                  />

                  <AvatarFallback className="rounded-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate text-sm font-medium">
                    {user.name ?? "Developer"}
                  </span>

                  <span className="truncate text-[11px] text-muted-foreground">
                    {user.email ?? "Developer account"}
                  </span>
                </div>

                <ChevronUp className="ml-auto size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="top"
                align="start"
                sideOffset={8}
                className="min-w-56"
              >
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => navigate("/profile")}
                >
                  <UserRound className="size-4" />
                  Profile
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => navigate("/settings")}
                >
                  <Settings className="size-4" />
                  Settings
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <AlertDialog>
                  <AlertDialogTrigger className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none hover:bg-destructive/10">
                    <LogOut className="size-4" />
                    Sign out
                  </AlertDialogTrigger>

                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Sign out of DevForge?
                      </AlertDialogTitle>

                      <AlertDialogDescription>
                        You will need to sign in again to access your developer workspace.
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                      <AlertDialogCancel className="cursor-pointer">
                        Cancel
                      </AlertDialogCancel>

                      <AlertDialogAction
                        className="cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() =>
                          signOut({
                            redirectTo: "/login",
                          })
                        }
                      >
                        Sign out
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}