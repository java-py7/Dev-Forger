"use client";

import { useState } from "react";
import {
  ChevronLeft,
  MoreVertical,
  Search,
  User,
  FolderKanban,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChatConversation, ChatUser } from "./types";
import { DeveloperProfileDialog } from "./developer-profile-dialog";

type ChatHeaderProps = {
  conversation: ChatConversation;
  currentUserId: string;
  onBackMobile: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isSearchOpen: boolean;
  onToggleSearch: () => void;
};

export function ChatHeader({
  conversation,
  currentUserId,
  onBackMobile,
  searchQuery,
  onSearchChange,
  isSearchOpen,
  onToggleSearch,
}: ChatHeaderProps) {
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  const isDirect = conversation.type === "DIRECT";
  const otherMember = conversation.members.find((m) => m.userId !== currentUserId);
  const otherUser: ChatUser | undefined = otherMember?.user;

  const title = isDirect
    ? otherUser?.name || (otherUser?.username ? `@${otherUser.username}` : "Developer")
    : conversation.name || conversation.project?.name || "Project Channel";

  const username = isDirect && otherUser?.username ? `@${otherUser.username}` : null;
  const roleName = isDirect ? otherUser?.profile?.roles?.[0]?.role?.name : null;
  const availability = isDirect ? otherUser?.profile?.availability : null;

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return "DF";
  };

  return (
    <>
      <div className="flex h-14 items-center justify-between border-b border-white/10 px-4 bg-card/60 backdrop-blur-sm shrink-0">
        {/* Left: Back button (mobile) + User Identity */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBackMobile}
            className="md:hidden size-8 shrink-0 cursor-pointer -ml-1 text-muted-foreground hover:text-foreground"
            aria-label="Back to conversations"
          >
            <ChevronLeft className="size-5" />
          </Button>

          <div className="relative shrink-0">
            {isDirect ? (
              <Avatar className="size-9 border border-white/10">
                <AvatarImage src={otherUser?.image || undefined} alt={title} />
                <AvatarFallback className="bg-muted text-xs font-semibold">
                  {getInitials(otherUser?.name, otherUser?.email)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-muted/60 text-muted-foreground">
                <FolderKanban className="size-4 text-foreground/80" />
              </div>
            )}

            {isDirect && availability === "AVAILABLE" && (
              <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
            )}
            {isDirect && availability === "BUSY" && (
              <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-amber-500 ring-2 ring-background" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-xs sm:text-sm font-semibold text-foreground">
                {title}
              </h2>
              {username && (
                <span className="hidden sm:inline-block truncate text-xs text-muted-foreground">
                  {username}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 mt-0.5">
              {isDirect ? (
                <>
                  {availability && (
                    <span className="text-[11px] text-muted-foreground capitalize">
                      {availability.toLowerCase().replace(/_/g, " ")}
                    </span>
                  )}
                  {availability && roleName && (
                    <span className="text-[10px] text-muted-foreground/50">·</span>
                  )}
                  {roleName && (
                    <span className="text-[11px] text-muted-foreground">
                      {roleName}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-[11px] text-muted-foreground">
                  {conversation.members.length} members
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSearch}
            className={`size-8 cursor-pointer text-muted-foreground hover:text-foreground ${
              isSearchOpen ? "bg-muted text-foreground" : ""
            }`}
            title="Search messages"
          >
            <Search className="size-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex size-8 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 border-white/10">
              {isDirect && otherUser && (
                <DropdownMenuItem
                  onClick={() => setProfileDialogOpen(true)}
                  className="cursor-pointer text-xs"
                >
                  <User className="mr-2 size-3.5" />
                  View Profile
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={onToggleSearch}
                className="cursor-pointer text-xs"
              >
                <Search className="mr-2 size-3.5" />
                Search Messages
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* In-conversation search bar */}
      {isSearchOpen && (
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2 bg-muted/20">
          <Search className="size-3.5 text-muted-foreground shrink-0" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search in this conversation..."
            className="h-7 text-xs bg-transparent border-0 shadow-none focus-visible:ring-0 p-0 placeholder:text-muted-foreground"
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="text-muted-foreground hover:text-foreground p-0.5"
            >
              <X className="size-3.5" />
            </button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSearch}
            className="h-6 text-[11px] px-2"
          >
            Done
          </Button>
        </div>
      )}

      {/* Profile Dialog */}
      {isDirect && otherUser && (
        <DeveloperProfileDialog
          userId={otherUser.id}
          open={profileDialogOpen}
          onOpenChange={setProfileDialogOpen}
        />
      )}
    </>
  );
}
