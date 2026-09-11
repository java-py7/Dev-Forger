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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { inviteToTeam } from "@/app/(dashboard)/teams/actions";

export type AvailableTeamUser = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  email: string;
};

type InviteTeamMemberDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  teamName: string;
  availableUsers: AvailableTeamUser[];
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

export function InviteTeamMemberDialog({
  open,
  onOpenChange,
  teamId,
  teamName,
  availableUsers,
  currentMemberIds,
}: InviteTeamMemberDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [role, setRole] = useState("DEVELOPER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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

    const res = await inviteToTeam({
      teamId,
      receiverId: selectedUserId,
      role,
    });

    setLoading(false);

    if (!res.success) {
      setError(res.error || "Failed to send team invitation.");
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setSelectedUserId(null);
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
            <DialogTitle>Invite to Team</DialogTitle>
          </div>
          <DialogDescription>
            Invite a developer to join{" "}
            <span className="font-semibold text-foreground">{teamName}</span>.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <Check className="size-6" />
            </div>
            <h4 className="mt-3 font-semibold text-foreground">Invitation Sent!</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              An invitation to join {teamName} has been sent to{" "}
              {selectedUser?.name || selectedUser?.username || "the developer"}.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Search */}
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

            {/* List */}
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

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="team-role">Role in Team</Label>
              <select
                id="team-role"
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
