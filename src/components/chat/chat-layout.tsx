"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ConversationList } from "./conversation-list";
import { ChatHeader } from "./chat-header";
import { MessageList } from "./message-list";
import { MessageComposer } from "./message-composer";
import { EmptyChat } from "./empty-chat";
import { NewConversationDialog } from "./new-conversation-dialog";
import { ChatConversation, ChatMessage } from "./types";
import {
  getConversations,
  getConversationMessages,
  sendMessage,
} from "@/app/(dashboard)/chat/actions";

type ChatLayoutProps = {
  currentUserId: string;
  initialConversations: ChatConversation[];
  initialActiveConversationId?: string | null;
  initialMessages?: ChatMessage[];
  initialHasMore?: boolean;
};

export function ChatLayout({
  currentUserId,
  initialConversations,
  initialActiveConversationId = null,
  initialMessages = [],
  initialHasMore = false,
}: ChatLayoutProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [conversations, setConversations] =
    useState<ChatConversation[]>(initialConversations);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialActiveConversationId || null
  );

  // Messages state
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Dialog and Search state
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Unread read-receipts tracking (conversationId -> lastReadTimestamp ISO string)
  const [lastReadTimestamps, setLastReadTimestamps] = useState<
    Record<string, string>
  >({});

  // Initialize read timestamps from localStorage if available
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`devforge_chat_read_${currentUserId}`);
      if (stored) {
        setLastReadTimestamps(JSON.parse(stored));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [currentUserId]);

  // Save read timestamp
  const markAsRead = useCallback(
    (convId: string, timestamp?: string) => {
      const timeToMark = timestamp || new Date().toISOString();
      setLastReadTimestamps((prev) => {
        const next = { ...prev, [convId]: timeToMark };
        try {
          localStorage.setItem(
            `devforge_chat_read_${currentUserId}`,
            JSON.stringify(next)
          );
        } catch {
          // ignore
        }
        return next;
      });
    },
    [currentUserId]
  );

  // Compute unread counts per conversation
  const unreadCounts = conversations.reduce<Record<string, number>>(
    (acc, conv) => {
      if (!conv.lastMessage) return acc;
      // If the last message was sent by the current user, it's not unread for them
      if (conv.lastMessage.senderId === currentUserId) return acc;

      const lastRead = lastReadTimestamps[conv.id];
      if (!lastRead) {
        // Never opened yet
        acc[conv.id] = 1;
      } else if (
        new Date(conv.lastMessage.createdAt).getTime() >
        new Date(lastRead).getTime()
      ) {
        acc[conv.id] = 1;
      }
      return acc;
    },
    {}
  );

  // Fetch messages when selectedId changes
  const fetchMessagesForConversation = useCallback(
    async (convId: string) => {
      setIsLoadingMessages(true);
      try {
        const res = await getConversationMessages(convId, 50);
        if (res.success && res.messages) {
          setMessages(res.messages);
          setHasMore(res.hasMore);
          // Mark conversation as read
          if (res.messages.length > 0) {
            const latest = res.messages[res.messages.length - 1];
            markAsRead(convId, latest.createdAt);
          } else {
            markAsRead(convId);
          }
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [markAsRead]
  );

  // Handle selecting a conversation
  const handleSelectConversation = (convId: string) => {
    if (convId === selectedId) return;
    setSelectedId(convId);
    setIsSearchOpen(false);
    setSearchQuery("");

    // Update URL query param quietly
    const url = new URL(window.location.href);
    url.searchParams.set("id", convId);
    window.history.replaceState(null, "", url.toString());

    fetchMessagesForConversation(convId);
  };

  // Back button on mobile
  const handleBackMobile = () => {
    setSelectedId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("id");
    window.history.replaceState(null, "", url.toString());
  };

  // Load earlier messages (pagination)
  const handleLoadMore = async () => {
    if (!selectedId || !hasMore || isLoadingMore || messages.length === 0)
      return;

    setIsLoadingMore(true);
    const oldestMessage = messages[0];

    try {
      const res = await getConversationMessages(
        selectedId,
        40,
        oldestMessage.createdAt
      );
      if (res.success && res.messages) {
        setMessages((prev) => [...res.messages, ...prev]);
        setHasMore(res.hasMore);
      }
    } catch (err) {
      console.error("Error loading earlier messages:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Send message with optimistic update
  const handleSendMessage = async (content: string): Promise<boolean> => {
    if (!selectedId) return false;

    const convId = selectedId;
    const tempId = `temp-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const optimisticMessage: ChatMessage = {
      id: tempId,
      conversationId: convId,
      senderId: currentUserId,
      content,
      createdAt: nowIso,
      updatedAt: nowIso,
      sender: {
        id: currentUserId,
        name: "You",
        username: null,
        image: null,
      },
    };

    // Append optimistically
    setMessages((prev) => [...prev, optimisticMessage]);

    // Update conversation item preview & sort to top
    setConversations((prev) => {
      const updated = prev.map((c) => {
        if (c.id === convId) {
          return {
            ...c,
            lastMessage: optimisticMessage,
            updatedAt: nowIso,
          };
        }
        return c;
      });
      return updated.sort(
        (a, b) =>
          new Date(b.lastMessage?.createdAt || b.updatedAt).getTime() -
          new Date(a.lastMessage?.createdAt || a.updatedAt).getTime()
      );
    });

    // Mark as read for current user
    markAsRead(convId, nowIso);

    try {
      const res = await sendMessage(convId, content);
      if (res.success && res.message) {
        const realMessage = res.message;
        // Replace temp message with server message
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? realMessage : m))
        );
        // Update conversation's last message with real server message
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId ? { ...c, lastMessage: realMessage } : c
          )
        );
        return true;
      } else {
        // Rollback on error
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        return false;
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      return false;
    }
  };

  // Handle new conversation started from dialog
  const handleConversationCreated = async (newConvId: string) => {
    // Refresh conversations list
    const res = await getConversations();
    if (res.success && res.conversations) {
      setConversations(res.conversations as unknown as ChatConversation[]);
    }
    handleSelectConversation(newConvId);
  };

  // Silent background polling for new messages & updated conversations
  useEffect(() => {
    let isPolling = false;

    const interval = setInterval(async () => {
      // Only poll when document is visible
      if (document.hidden || isPolling) return;
      isPolling = true;

      try {
        // Refresh conversations
        const convRes = await getConversations();
        if (convRes.success && convRes.conversations) {
          setConversations(convRes.conversations as unknown as ChatConversation[]);
        }

        // If a conversation is active, check for new messages
        if (selectedId) {
          const msgsRes = await getConversationMessages(selectedId, 50);
          if (msgsRes.success && msgsRes.messages) {
            setMessages((prev) => {
              // Check if there are new messages not yet present
              const existingIds = new Set(prev.map((m) => m.id));
              const hasNew = msgsRes.messages.some((m) => !existingIds.has(m.id));
              if (hasNew) {
                // Mark conversation as read
                const latest = msgsRes.messages[msgsRes.messages.length - 1];
                if (latest) {
                  markAsRead(selectedId, latest.createdAt);
                }
                return msgsRes.messages;
              }
              return prev;
            });
          }
        }
      } catch {
        // Ignore polling errors
      } finally {
        isPolling = false;
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedId, markAsRead]);

  // Selected conversation object
  const activeConversation = conversations.find((c) => c.id === selectedId);

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] w-full overflow-hidden bg-background">
      {/* -------------------------------------------------------------
          LEFT SIDEBAR: Conversation list
          Mobile: hidden when a conversation is active
          Desktop: always visible w-80 or w-84
      ------------------------------------------------------------- */}
      <div
        className={`w-full md:w-80 lg:w-88 shrink-0 flex-col ${
          selectedId ? "hidden md:flex" : "flex"
        }`}
      >
        <ConversationList
          conversations={conversations}
          currentUserId={currentUserId}
          selectedConversationId={selectedId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={() => setNewDialogOpen(true)}
          unreadCounts={unreadCounts}
        />
      </div>

      {/* -------------------------------------------------------------
          RIGHT AREA: Active conversation
          Mobile: hidden when no conversation is selected
          Desktop: flex-1
      ------------------------------------------------------------- */}
      <div
        className={`flex-1 flex-col h-full overflow-hidden ${
          selectedId ? "flex" : "hidden md:flex"
        }`}
      >
        {activeConversation ? (
          <>
            <ChatHeader
              conversation={activeConversation}
              currentUserId={currentUserId}
              onBackMobile={handleBackMobile}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              isSearchOpen={isSearchOpen}
              onToggleSearch={() => {
                setIsSearchOpen((prev) => !prev);
                if (isSearchOpen) setSearchQuery("");
              }}
            />

            <MessageList
              messages={messages}
              currentUserId={currentUserId}
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
              onLoadMore={handleLoadMore}
              searchQuery={searchQuery}
            />

            <MessageComposer
              conversationId={activeConversation.id}
              onSendMessage={handleSendMessage}
            />
          </>
        ) : (
          <EmptyChat
            type="no-selection"
            onNewConversation={() => setNewDialogOpen(true)}
          />
        )}
      </div>

      {/* New Conversation Dialog */}
      <NewConversationDialog
        open={newDialogOpen}
        onOpenChange={setNewDialogOpen}
        onConversationSelected={handleConversationCreated}
      />
    </div>
  );
}
