"use client";

import { useState, useMemo } from "react";
import { UserPlus, Search, Check, AlertCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { inviteToProject } from "@/app/(dashboard)/projects/actions";

export type AvailableUser = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  email: string;
};

type InviteMemberDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  availableUsers: AvailableUser[];
  currentMemberIds: string[];
};

function getInitials(name: string | null, email: string) {
  return (
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ||
    email.slice(0, 2).toUpperCase() ||
    "DV"
  );
}

export function InviteMemberDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  availableUsers,
  currentMemberIds,
}: InviteMemberDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [role, setRole] = useState("DEVELOPER");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Filter out developers who are already members
  const candidateUsers = useMemo(() => {
    const memberSet = new Set(currentMemberIds);
    const nonMembers = availableUsers.filter((u) => !memberSet.has(u.id));

    if (!search.trim()) return nonMembers;

    const q = search.trim().toLowerCase();
    return nonMembers.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }, [availableUsers, currentMemberIds, search]);

  const selectedUser = candidateUsers.find((u) => u.id === selectedUserId);

  async function handleInvite() {
    if (!selectedUserId) {
      setError("Please select a developer to invite.");
      return;
    }

    setLoading(true);
    setError("");

    const res = await inviteToProject({
      projectId,
      receiverId: selectedUserId,
      role,
      message,
    });

    setLoading(false);

    if (!res.success) {
      setError(res.error || "Failed to send invitation.");
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setSelectedUserId(null);
      setMessage("");
      onOpenChange(false);
    }, 1200);
  }

  function handleClose(value: boolean) {
    if (!loading) {
      setError("");
      setSuccess(false);
      onOpenChange(value);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserPlus className="size-4" />
            </div>
            <DialogTitle>Invite Developer</DialogTitle>
          </div>
          <DialogDescription>
            Invite a registered developer to collaborate on{" "}
            <span className="font-semibold text-foreground">{projectName}</span>.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <Check className="size-6" />
            </div>
            <h4 className="mt-3 font-semibold text-foreground">Invitation Sent!</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              An invitation has been sent to {selectedUser?.name || selectedUser?.username || "the developer"}.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Search developers */}
            <div className="space-y-2">
              <Label>Search Developers</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, username, or email..."
                  className="h-10 pl-9"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Developer List */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Select developer ({candidateUsers.length} available)
              </Label>
              <div className="max-h-48 overflow-y-auto rounded-lg border divide-y bg-muted/20">
                {candidateUsers.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No developers found.
                  </div>
                ) : (
                  candidateUsers.map((user) => {
                    const isSelected = user.id === selectedUserId;
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => setSelectedUserId(user.id)}
                        className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent/50 ${
                          isSelected ? "bg-accent font-medium" : ""
                        }`}
                      >
                        <Avatar className="size-8 shrink-0">
                          <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
                          <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium text-foreground">
                            {user.name || user.username || "Developer"}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {user.username ? `@${user.username}` : user.email}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="size-4 shrink-0 text-primary" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Role selection */}
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <select
                id="invite-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={loading}
                className="flex h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:border-ring"
              >
                <option value="DEVELOPER">Developer</option>
                <option value="DESIGNER">Designer</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            {/* Personal message */}
            <div className="space-y-2">
              <Label htmlFor="invite-message">Personal message (optional)</Label>
              <Textarea
                id="invite-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hi! Would love to have you collaborate on this project..."
                rows={2}
                maxLength={500}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => handleClose(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={loading || !selectedUserId}
                onClick={handleInvite}
              >
                {loading ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
