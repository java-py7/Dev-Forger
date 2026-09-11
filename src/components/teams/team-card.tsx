"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Check,
  Crown,
  LogOut,
  Pencil,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  deleteTeam,
  leaveTeam,
  joinTeam,
  acceptTeamInvitation,
  declineTeamInvitation,
} from "@/app/(dashboard)/teams/actions";
import {
  InviteTeamMemberDialog,
  AvailableTeamUser,
} from "@/components/teams/invite-team-member-dialog";
import { EditTeamDialog } from "@/components/teams/edit-team-dialog";

export type TeamMemberData = {
  id: string;
  userId: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
    email: string;
  };
};

export type TeamData = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  owner: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
    email: string;
  };
  members: TeamMemberData[];
  memberCount: number;
  memberIds: string[];
  isOwner: boolean;
  isMember: boolean;
  userRole?: string;
  pendingInvitationId?: string | null;
};

type TeamCardProps = {
  team: TeamData;
  availableUsers: AvailableTeamUser[];
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
    "TM"
  );
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return "Recently";
    }
    const month = MONTH_NAMES[d.getUTCMonth()];
    const day = d.getUTCDate();
    const year = d.getUTCFullYear();
    return `${month} ${day}, ${year}`;
  } catch {
    return "Recently";
  }
}

export function TeamCard({ team, availableUsers }: TeamCardProps) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const ownerName = team.owner.name || team.owner.username || "Developer";

  async function handleDelete() {
    setDeleteLoading(true);
    const res = await deleteTeam(team.id);
    setDeleteLoading(false);
    if (res.success) {
      setDeleteOpen(false);
      router.refresh();
    } else {
      alert(res.error || "Failed to delete team");
    }
  }

  async function handleLeave() {
    setLeaveLoading(true);
    const res = await leaveTeam(team.id);
    setLeaveLoading(false);
    if (res.success) {
      setLeaveOpen(false);
      router.refresh();
    } else {
      alert(res.error || "Failed to leave team");
    }
  }

  async function handleJoin() {
    setActionLoading(true);
    const res = await joinTeam(team.id);
    setActionLoading(false);
    if (res.success) {
      router.refresh();
    } else {
      alert(res.error || "Failed to join team");
    }
  }

  async function handleAcceptInvite(invitationId: string) {
    setActionLoading(true);
    const res = await acceptTeamInvitation(invitationId);
    setActionLoading(false);
    if (res.success) {
      router.refresh();
    } else {
      alert(res.error || "Failed to accept invitation");
    }
  }

  async function handleDeclineInvite(invitationId: string) {
    setActionLoading(true);
    const res = await declineTeamInvitation(invitationId);
    setActionLoading(false);
    if (res.success) {
      router.refresh();
    } else {
      alert(res.error || "Failed to decline invitation");
    }
  }

  return (
    <>
      <div className="group rounded-xl border bg-card p-5 transition-colors hover:border-foreground/20 hover:bg-accent/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Main Info */}
          <div className="flex min-w-0 flex-1 items-start gap-4">
            {/* Team icon */}
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-muted/40 text-base font-semibold">
              {team.name.charAt(0).toUpperCase()}
            </div>

            {/* Information */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-base font-semibold text-foreground">
                  {team.name}
                </h3>

                {team.isOwner && (
                  <Badge variant="secondary" className="gap-1 text-xs font-normal">
                    <Crown className="size-3 text-amber-500" />
                    Owner
                  </Badge>
                )}

                {team.isMember && !team.isOwner && (
                  <Badge variant="outline" className="text-xs font-normal">
                    {team.userRole || "Member"}
                  </Badge>
                )}

                {team.pendingInvitationId && (
                  <Badge variant="secondary" className="border-primary/20 bg-primary/10 text-xs font-normal text-primary">
                    Invited
                  </Badge>
                )}
              </div>

              <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                {team.description || "No description provided."}
              </p>

              {/* Members preview stack & metadata */}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  {/* Member avatars */}
                  <div className="flex -space-x-2 overflow-hidden">
                    {team.members.slice(0, 5).map((member) => (
                      <Avatar
                        key={member.id}
                        className="size-6 border-2 border-background ring-1 ring-border"
                        title={member.user.name || member.user.username || member.user.email}
                      >
                        <AvatarImage src={member.user.image ?? undefined} />
                        <AvatarFallback className="text-[10px]">
                          {getInitials(member.user.name, member.user.email)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>

                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <Users className="size-3.5 text-muted-foreground" />
                    {team.memberCount} {team.memberCount === 1 ? "member" : "members"}
                  </span>
                </div>

                <span>created by {ownerName}</span>

                <span className="flex items-center gap-1" suppressHydrationWarning>
                  <Calendar className="size-3.5" />
                  {formatDate(team.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 flex-wrap items-center gap-2 pt-2 sm:pt-0">
            {team.isOwner ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditOpen(true)}
                  className="h-8 gap-1.5 text-xs"
                >
                  <Pencil className="size-3.5" />
                  Edit
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setInviteOpen(true)}
                  className="h-8 gap-1.5 text-xs"
                >
                  <UserPlus className="size-3.5" />
                  Invite
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteOpen(true)}
                  className="h-8 gap-1 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </Button>
              </>
            ) : team.pendingInvitationId ? (
              <>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  disabled={actionLoading}
                  onClick={() => handleAcceptInvite(team.pendingInvitationId!)}
                  className="h-8 gap-1 text-xs"
                >
                  <Check className="size-3.5" />
                  Accept
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={actionLoading}
                  onClick={() => handleDeclineInvite(team.pendingInvitationId!)}
                  className="h-8 gap-1 text-xs text-muted-foreground hover:text-destructive"
                >
                  <X className="size-3.5" />
                  Decline
                </Button>
              </>
            ) : team.isMember ? (
              <>
                <Badge variant="secondary" className="h-8 px-2.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  Joined
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setLeaveOpen(true)}
                  className="h-8 gap-1 text-xs text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="size-3.5" />
                  Leave
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="default"
                size="sm"
                disabled={actionLoading}
                onClick={handleJoin}
                className="h-8 gap-1.5 text-xs"
              >
                <Users className="size-3.5" />
                Join team
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">{team.name}</span>? This action cannot be undone and will permanently remove this team and all member associations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? "Deleting..." : "Delete team"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Team Alert Dialog */}
      <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave <span className="font-semibold text-foreground">{team.name}</span>? You will need to be invited again to rejoin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={leaveLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleLeave();
              }}
              disabled={leaveLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {leaveLoading ? "Leaving..." : "Leave team"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Invite Member Dialog */}
      <InviteTeamMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        teamId={team.id}
        teamName={team.name}
        availableUsers={availableUsers}
        currentMemberIds={team.memberIds}
      />

      {/* Edit Team Dialog */}
      <EditTeamDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        team={team}
      />
    </>
  );
}
