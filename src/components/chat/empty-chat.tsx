"use client";

import { MessageSquare, MessageSquarePlus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

type EmptyChatProps = {
  type: "no-conversations" | "no-selection" | "no-messages" | "no-search-results";
  onNewConversation?: () => void;
};

export function EmptyChat({ type, onNewConversation }: EmptyChatProps) {
  if (type === "no-conversations") {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-muted/40 shadow-inner">
          <MessageSquarePlus className="size-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-base font-semibold tracking-tight text-foreground">
          Start a conversation
        </h3>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          Connect with another developer and start building together.
        </p>
        {onNewConversation && (
          <Button
            onClick={onNewConversation}
            className="mt-5 h-9 cursor-pointer gap-2 px-4 text-xs font-medium"
          >
            <MessageSquarePlus className="size-4" />
            New conversation
          </Button>
        )}
      </div>
    );
  }

  if (type === "no-selection") {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-muted/30">
          <MessageSquare className="size-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-base font-semibold tracking-tight text-foreground">
          Select a conversation
        </h3>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          Choose a conversation from the sidebar or start a new direct message.
        </p>
        {onNewConversation && (
          <Button
            variant="outline"
            onClick={onNewConversation}
            className="mt-5 h-9 cursor-pointer gap-2 border-white/10 px-4 text-xs font-medium hover:bg-muted"
          >
            <MessageSquarePlus className="size-4" />
            New conversation
          </Button>
        )}
      </div>
    );
  }

  if (type === "no-messages") {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl border border-white/10 bg-muted/30">
          <MessageSquare className="size-5 text-muted-foreground" />
        </div>
        <h3 className="mt-3 text-sm font-semibold tracking-tight text-foreground">
          No messages yet
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Start the conversation. Send a message below!
        </p>
      </div>
    );
  }

  if (type === "no-search-results") {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-muted/30">
          <Search className="size-4 text-muted-foreground" />
        </div>
        <h4 className="mt-3 text-xs font-medium text-foreground">
          No conversations found
        </h4>
        <p className="mt-1 text-xs text-muted-foreground">
          Try a different keyword or username.
        </p>
      </div>
    );
  }

  return null;
}
