"use client";

import { useState, useMemo } from "react";
import { MessageSquarePlus, MessageSquare, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConversationSearch } from "./conversation-search";
import { ConversationItem } from "./conversation-item";
import { EmptyChat } from "./empty-chat";
import { ChatConversation } from "./types";

type ConversationListProps = {
  conversations: ChatConversation[];
  currentUserId: string;
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  unreadCounts: Record<string, number>;
};

export function ConversationList({
  conversations,
  currentUserId,
  selectedConversationId,
  onSelectConversation,
  onNewConversation,
  unreadCounts,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "DIRECT" | "PROJECT">("ALL");

  // Filter conversations
  const filteredConversations = useMemo(() => {
    let list = conversations;

    // Filter by tab
    if (activeTab === "DIRECT") {
      list = list.filter((c) => c.type === "DIRECT");
    } else if (activeTab === "PROJECT") {
      list = list.filter((c) => c.type === "PROJECT" || c.type === "TEAM");
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((c) => {
        // Direct conversation name / username
        if (c.type === "DIRECT") {
          const other = c.members.find((m) => m.userId !== currentUserId)?.user;
          const matchName = other?.name?.toLowerCase().includes(q);
          const matchUsername = other?.username?.toLowerCase().includes(q);
          const matchMsg = c.lastMessage?.content.toLowerCase().includes(q);
          return matchName || matchUsername || matchMsg;
        } else {
          // Project name
          const matchProject = c.project?.name.toLowerCase().includes(q);
          const matchName = c.name?.toLowerCase().includes(q);
          const matchMsg = c.lastMessage?.content.toLowerCase().includes(q);
          return matchProject || matchName || matchMsg;
        }
      });
    }

    return list;
  }, [conversations, activeTab, searchQuery, currentUserId]);

  const directCount = conversations.filter((c) => c.type === "DIRECT").length;
  const projectCount = conversations.filter(
    (c) => c.type === "PROJECT" || c.type === "TEAM"
  ).length;

  return (
    <div className="flex flex-col h-full bg-card/40 border-r border-white/10 select-none">
      {/* Header */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4 text-foreground/80" />
          <h1 className="text-sm font-semibold tracking-tight text-foreground">
            Chat
          </h1>
        </div>

        <Button
          size="sm"
          onClick={onNewConversation}
          className="h-8 gap-1.5 px-2.5 text-xs font-medium cursor-pointer"
        >
          <MessageSquarePlus className="size-3.5" />
          <span>New</span>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="p-3 pb-2 shrink-0">
        <ConversationSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search conversations..."
        />
      </div>

      {/* Filter Tabs (All / Direct / Projects) */}
      {projectCount > 0 && (
        <div className="flex items-center gap-1 px-3 pb-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
              activeTab === "ALL"
                ? "bg-muted text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({conversations.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("DIRECT")}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
              activeTab === "DIRECT"
                ? "bg-muted text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Direct ({directCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("PROJECT")}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
              activeTab === "PROJECT"
                ? "bg-muted text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Projects ({projectCount})
          </button>
        </div>
      )}

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
        {conversations.length === 0 ? (
          <EmptyChat
            type="no-conversations"
            onNewConversation={onNewConversation}
          />
        ) : filteredConversations.length === 0 ? (
          <EmptyChat type="no-search-results" />
        ) : (
          filteredConversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              currentUserId={currentUserId}
              isSelected={conv.id === selectedConversationId}
              onSelect={onSelectConversation}
              unreadCount={unreadCounts[conv.id] || 0}
            />
          ))
        )}
      </div>
    </div>
  );
}
