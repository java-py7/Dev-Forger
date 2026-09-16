"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatMessage } from "./types";

type MessageItemProps = {
  message: ChatMessage;
  isCurrentUser: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  showDateSeparator?: boolean;
  dateLabel?: string;
};

export function MessageItem({
  message,
  isCurrentUser,
  isFirstInGroup,
  isLastInGroup,
  showDateSeparator,
  dateLabel,
}: MessageItemProps) {
  const getInitials = (name?: string | null, username?: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    }
    if (username) return username.slice(0, 2).toUpperCase();
    return "DF";
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col w-full">
      {/* Date Separator */}
      {showDateSeparator && dateLabel && (
        <div className="flex items-center justify-center my-4">
          <div className="rounded-full border border-white/10 bg-muted/50 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-2xs">
            {dateLabel}
          </div>
        </div>
      )}

      {/* Message Row */}
      <div
        className={`group flex items-end gap-2 px-4 ${
          isCurrentUser ? "justify-end" : "justify-start"
        } ${isFirstInGroup ? "mt-3" : "mt-1"}`}
      >
        {/* Avatar for other user (only show if last in consecutive group) */}
        {!isCurrentUser && (
          <div className="size-7 shrink-0">
            {isLastInGroup ? (
              <Avatar className="size-7 border border-white/10">
                <AvatarImage
                  src={message.sender?.image || undefined}
                  alt={message.sender?.name || "User"}
                />
                <AvatarFallback className="bg-muted text-[10px] font-semibold">
                  {getInitials(message.sender?.name, message.sender?.username)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="size-7" />
            )}
          </div>
        )}

        {/* Bubble & Metadata */}
        <div
          className={`flex flex-col max-w-[78%] sm:max-w-[70%] md:max-w-[62%] ${
            isCurrentUser ? "items-end" : "items-start"
          }`}
        >
          {/* Sender name for other user (first in group only) */}
          {!isCurrentUser && isFirstInGroup && (
            <span className="mb-1 ml-1 text-[11px] font-medium text-muted-foreground">
              {message.sender?.name ||
                (message.sender?.username ? `@${message.sender.username}` : "Developer")}
            </span>
          )}

          {/* Bubble */}
          <div
            className={`relative rounded-2xl px-3.5 py-2 text-xs leading-relaxed break-words whitespace-pre-wrap ${
              isCurrentUser
                ? "bg-primary text-primary-foreground rounded-br-xs shadow-xs"
                : "bg-muted/80 text-foreground border border-white/10 rounded-bl-xs"
            }`}
          >
            <span>{message.content}</span>
            <span
              className={`float-right ml-2.5 mt-1 text-[10px] tabular-nums select-none ${
                isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground/70"
              }`}
            >
              {formatTime(message.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
