"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, UserPlus, Users, Briefcase } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { searchEligibleUsers, startDirectConversation } from "@/app/(dashboard)/chat/actions";

type UserCandidate = {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  image: string | null;
  profile?: {
    bio?: string | null;
    location?: string | null;
    availability?: string;
    roles?: {
      role: {
        id: string;
        name: string;
      };
    }[];
  } | null;
};

type NewConversationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversationSelected: (conversationId: string) => void;
  initialUsers?: UserCandidate[];
};

export function NewConversationDialog({
  open,
  onOpenChange,
  onConversationSelected,
  initialUsers = [],
}: NewConversationDialogProps) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserCandidate[]>(initialUsers);
  const [loading, setLoading] = useState(false);
  const [startingUserId, setStartingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Search when query changes or dialog opens
  useEffect(() => {
    if (!open) {
      setQuery("");
      setError(null);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      searchEligibleUsers(query)
        .then((res) => {
          if (res.success && res.users) {
            setUsers(res.users as unknown as UserCandidate[]);
          } else {
            setError(res.error || "Failed to search users.");
          }
        })
        .catch(() => setError("An unexpected error occurred."))
        .finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [query, open]);

  const handleSelectUser = async (targetUser: UserCandidate) => {
    setStartingUserId(targetUser.id);
    setError(null);

    try {
      const res = await startDirectConversation(targetUser.id);
      if (res.success && res.conversationId) {
        onConversationSelected(res.conversationId);
        onOpenChange(false);
      } else {
        setError(res.error || "Failed to start conversation.");
      }
    } catch {
      setError("An error occurred while connecting.");
    } finally {
      setStartingUserId(null);
    }
  };

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-white/10 bg-card p-0">
        <DialogHeader className="border-b border-white/10 px-5 py-4">
          <DialogTitle className="text-base font-semibold">
            New Conversation
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Search for a developer on DevForge to start chatting.
          </DialogDescription>
        </DialogHeader>

        {/* Search Input */}
        <div className="p-4 pb-2 border-b border-white/5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or username..."
              className="h-9 pl-9 pr-3 text-xs bg-muted/40 border-white/10 rounded-lg placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
          {error && (
            <p className="mt-2 text-xs text-destructive">{error}</p>
          )}
        </div>

        {/* User List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-white/5">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <Users className="size-8 text-muted-foreground/60" />
              <p className="mt-2 text-xs font-medium text-foreground">
                No developers found
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {query ? "Try searching for another name." : "No other users available yet."}
              </p>
            </div>
          ) : (
            users.map((user) => {
              const isStarting = startingUserId === user.id;
              const roleName = user.profile?.roles?.[0]?.role?.name;

              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <Avatar className="size-9 border border-white/10">
                        <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
                        <AvatarFallback className="bg-muted text-xs font-medium">
                          {getInitials(user.name, user.email)}
                        </AvatarFallback>
                      </Avatar>
                      {user.profile?.availability === "AVAILABLE" && (
                        <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">
                        {user.name || "Developer"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {user.username && (
                          <span className="truncate text-[11px] text-muted-foreground">
                            @{user.username}
                          </span>
                        )}
                        {roleName && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1 py-0 border-white/10 font-normal">
                            <Briefcase className="size-2.5 mr-0.5" />
                            {roleName}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isStarting}
                    onClick={() => handleSelectUser(user)}
                    className="h-8 shrink-0 cursor-pointer gap-1.5 border-white/10 px-3 text-xs font-medium hover:bg-muted"
                  >
                    {isStarting ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="size-3.5" />
                        Chat
                      </>
                    )}
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
