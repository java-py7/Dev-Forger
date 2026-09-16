"use client";

import { useRef, useEffect, UIEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "./types";
import { MessageItem } from "./message-item";
import { EmptyChat } from "./empty-chat";

type MessageListProps = {
  messages: ChatMessage[];
  currentUserId: string;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  searchQuery?: string;
};

export function MessageList({
  messages,
  currentUserId,
  hasMore,
  isLoadingMore,
  onLoadMore,
  searchQuery = "",
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  const isInitialScrollDone = useRef(false);
  const prevMessagesLength = useRef(messages.length);

  // Filter messages if search query is active
  const filteredMessages = searchQuery.trim()
    ? messages.filter((m) =>
        m.content.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : messages;

  // Scroll to bottom on initial mount or when new message is appended at bottom
  useEffect(() => {
    if (!isInitialScrollDone.current && messages.length > 0) {
      bottomAnchorRef.current?.scrollIntoView({ behavior: "instant" });
      isInitialScrollDone.current = true;
    } else if (messages.length > prevMessagesLength.current) {
      // If messages grew (e.g. sent a message or received a new one), scroll down
      const container = containerRef.current;
      if (container) {
        const isNearBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight < 200;
        if (isNearBottom) {
          bottomAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
    prevMessagesLength.current = messages.length;
  }, [messages]);

  // Helper to format date label
  const getDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();

    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
    if (isToday) return "Today";

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();
    if (isYesterday) return "Yesterday";

    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const isSameDay = (d1: string, d2: string) => {
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto">
        <EmptyChat type="no-messages" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto py-4 space-y-1 select-text"
    >
      {/* Load earlier messages button */}
      {hasMore && (
        <div className="flex justify-center pb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="h-7 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            {isLoadingMore ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : null}
            Load earlier messages
          </Button>
        </div>
      )}

      {filteredMessages.map((msg, index) => {
        const isCurrentUser = msg.senderId === currentUserId;
        const prevMsg = filteredMessages[index - 1];
        const nextMsg = filteredMessages[index + 1];

        // Date separator check
        const showDateSeparator =
          index === 0 || !isSameDay(prevMsg.createdAt, msg.createdAt);
        const dateLabel = showDateSeparator
          ? getDateLabel(msg.createdAt)
          : undefined;

        // Grouping consecutive messages from same sender (within 5 minutes)
        const isSameSenderAsPrev =
          prevMsg &&
          prevMsg.senderId === msg.senderId &&
          isSameDay(prevMsg.createdAt, msg.createdAt) &&
          Math.abs(
            new Date(msg.createdAt).getTime() -
              new Date(prevMsg.createdAt).getTime()
          ) < 5 * 60 * 1000;

        const isSameSenderAsNext =
          nextMsg &&
          nextMsg.senderId === msg.senderId &&
          isSameDay(nextMsg.createdAt, msg.createdAt) &&
          Math.abs(
            new Date(nextMsg.createdAt).getTime() -
              new Date(msg.createdAt).getTime()
          ) < 5 * 60 * 1000;

        const isFirstInGroup = !isSameSenderAsPrev;
        const isLastInGroup = !isSameSenderAsNext;

        return (
          <MessageItem
            key={msg.id}
            message={msg}
            isCurrentUser={isCurrentUser}
            isFirstInGroup={isFirstInGroup}
            isLastInGroup={isLastInGroup}
            showDateSeparator={showDateSeparator}
            dateLabel={dateLabel}
          />
        );
      })}

      <div ref={bottomAnchorRef} className="h-2" />
    </div>
  );
}
