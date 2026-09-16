"use client";

import { FolderKanban, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChatConversation, ChatUser } from "./types";

type ConversationItemProps = {
  conversation: ChatConversation;
  currentUserId: string;
  isSelected: boolean;
  onSelect: (conversationId: string) => void;
  unreadCount?: number;
};

export function ConversationItem({
  conversation,
  currentUserId,
  isSelected,
  onSelect,
  unreadCount = 0,
}: ConversationItemProps) {
  const isDirect = conversation.type === "DIRECT";

  // For 1-on-1 direct conversations, target user is the OTHER member
  const otherMember = conversation.members.find((m) => m.userId !== currentUserId);
  const otherUser: ChatUser | undefined = otherMember?.user;

  // Title: If direct, other user's name (or username/Developer); if project, project name or conversation name
  const title = isDirect
    ? otherUser?.name || (otherUser?.username ? `@${otherUser.username}` : "Developer")
    : conversation.name || conversation.project?.name || "Project Channel";

  const subtitle = isDirect && otherUser?.username ? `@${otherUser.username}` : null;

  // Initials
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

  // Format relative timestamp
  const formatTime = (isoString?: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) return "Yesterday";

    // Same year
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }

    return date.toLocaleDateString([], { month: "short", day: "numeric", year: "2-digit" });
  };

  const lastMessage = conversation.lastMessage;
  const timeDisplay = formatTime(lastMessage?.createdAt || conversation.updatedAt);

  // Message preview text
  let previewText = "No messages yet";
  if (lastMessage) {
    const isFromMe = lastMessage.senderId === currentUserId;
    previewText = `${isFromMe ? "You: " : ""}${lastMessage.content}`;
  }

  const availability = otherUser?.profile?.availability;

  return (
    <button
      type="button"
      onClick={() => onSelect(conversation.id)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer border ${
        isSelected
          ? "bg-accent/80 border-white/15 shadow-xs"
          : "border-transparent hover:bg-muted/40 hover:border-white/5"
      }`}
    >
      {/* Avatar / Icon */}
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

        {/* Real availability indicator dot */}
        {isDirect && availability === "AVAILABLE" && (
          <span
            title="Available"
            className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background"
          />
        )}
        {isDirect && availability === "BUSY" && (
          <span
            title="Busy"
            className="absolute bottom-0 right-0 size-2.5 rounded-full bg-amber-500 ring-2 ring-background"
          />
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={`truncate text-xs font-medium ${
                isSelected ? "text-foreground font-semibold" : "text-foreground"
              }`}
            >
              {title}
            </span>
            {subtitle && (
              <span className="hidden sm:inline-block truncate text-[11px] text-muted-foreground">
                {subtitle}
              </span>
            )}
          </div>

          {timeDisplay && (
            <span className="shrink-0 text-[10px] text-muted-foreground">
              {timeDisplay}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 mt-1">
          <p
            className={`truncate text-[11px] leading-tight ${
              unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground"
            }`}
          >
            {previewText}
          </p>

          {unreadCount > 0 && (
            <Badge
              variant="default"
              className="size-4.5 p-0 flex items-center justify-center rounded-full text-[10px] font-semibold shrink-0"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}
