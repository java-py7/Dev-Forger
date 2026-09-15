"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Code2,
  ExternalLink,
  GitBranch,
  Globe,
  Lock,
  LogOut,
  Pencil,
  Tag,
  Trash2,
  UserPlus,
  Users,
  Clock,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

import { deleteProject, leaveProject } from "@/app/(dashboard)/projects/actions";
import { InviteMemberDialog, AvailableUser } from "@/components/projects/invite-member-dialog";
import { CollaborateDialog } from "@/components/projects/collaborate-dialog";
import { EditProjectDialog } from "@/components/projects/edit-project-dialog";
import { AvailableSkill } from "@/components/projects/create-project-dialog";

export type Project = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  language: string | null;
  repositoryUrl: string | null;
  websiteUrl: string | null;
  visibility: string;
  status: string;
  maxMembers: number | null;
  owner: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  memberCount: number;
  memberIds: string[];
  isOwner: boolean;
  isMember: boolean;
  hasPendingApplication?: boolean;
};

type ProjectCardProps = {
  project: Project;
  availableUsers: AvailableUser[];
  availableSkills?: AvailableSkill[];
};

function formatStatus(status: string) {
  switch (status) {
    case "PLANNING":
      return "Planning";
    case "ACTIVE":
      return "Active";
    case "COMPLETED":
      return "Completed";
    case "ARCHIVED":
      return "Archived";
    default:
      return status;
  }
}

export function ProjectCard({ project, availableUsers, availableSkills = [] }: ProjectCardProps) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [collabOpen, setCollabOpen] = useState(false);
  const [pendingApplication, setPendingApplication] = useState(
    project.hasPendingApplication ?? false
  );

  const ownerName =
    project.owner.name || project.owner.username || "Developer";

  async function handleDelete() {
    setDeleteLoading(true);
    const res = await deleteProject(project.id);
    setDeleteLoading(false);
    if (res.success) {
      setDeleteOpen(false);
      router.refresh();
    } else {
      alert(res.error || "Failed to delete project");
    }
  }

  async function handleLeave() {
    setLeaveLoading(true);
    const res = await leaveProject(project.id);
    setLeaveLoading(false);
    if (res.success) {
      setLeaveOpen(false);
      router.refresh();
    } else {
      alert(res.error || "Failed to leave project");
    }
  }

  return (
    <>
      <div className="group rounded-xl border bg-card p-5 transition-colors hover:border-foreground/20 hover:bg-accent/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Main Info */}
          <div className="flex min-w-0 flex-1 items-start gap-4">
            {/* Project icon */}
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-muted/40 text-base font-semibold">
              {project.name.charAt(0).toUpperCase()}
            </div>

            {/* Information */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/projects/${project.slug}`}
                  className="truncate text-base font-semibold hover:underline"
                >
                  {project.name}
                </Link>

                {project.visibility === "PRIVATE" && (
                  <Badge variant="outline" className="gap-1 text-xs text-muted-foreground">
                    <Lock className="size-3" />
                    Private
                  </Badge>
                )}

                {project.category && (
                  <Badge variant="secondary" className="gap-1 text-xs font-normal">
                    <Tag className="size-3" />
                    {project.category}
                  </Badge>
                )}

                {project.language && (
                  <Badge variant="outline" className="gap-1 border-primary/20 bg-primary/5 text-xs text-primary font-normal">
                    <Code2 className="size-3" />
                    {project.language}
                  </Badge>
                )}
              </div>

              <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                {project.description || "No description provided."}
              </p>

              {/* Badges & Meta */}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <Badge variant="secondary" className="text-xs font-normal">
                  {formatStatus(project.status)}
                </Badge>

                <span>by {ownerName}</span>

                <span className="flex items-center gap-1">
                  <Users className="size-3.5" />
                  {project.memberCount}
                  {project.maxMembers ? ` / ${project.maxMembers}` : ""} members
                </span>

                {project.repositoryUrl && (
                  <a
                    href={project.repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <GitBranch className="size-3.5" />
                    <span>Repo</span>
                    <ExternalLink className="size-2.5" />
                  </a>
                )}

                {project.websiteUrl && (
                  <a
                    href={project.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Globe className="size-3.5" />
                    <span>Live</span>
                    <ExternalLink className="size-2.5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex shrink-0 flex-wrap items-center gap-2 pt-2 sm:pt-0">
            {/* Owner Actions */}
            {project.isOwner ? (
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
            ) : project.isMember ? (
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
            ) : pendingApplication ? (
              <Badge variant="outline" className="h-8 gap-1.5 px-3 text-xs text-muted-foreground">
                <Clock className="size-3.5" />
                Request Pending
              </Badge>
            ) : (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => setCollabOpen(true)}
                className="h-8 gap-1.5 text-xs"
              >
                <Users className="size-3.5" />
                Collaborate
              </Button>
            )}

            <Link
              href={`/projects/${project.slug}/code`}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border bg-background px-2.5 text-xs font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              title="Open DevForge Cloud IDE"
            >
              <Code2 className="size-3.5 text-primary" />
              <span>Open IDE</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">{project.name}</span>? This action cannot be undone and will permanently delete the project and all related team data.
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
              {deleteLoading ? "Deleting..." : "Delete project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Project Alert Dialog */}
      <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave <span className="font-semibold text-foreground">{project.name}</span>? You will lose access to project resources unless invited again.
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
              {leaveLoading ? "Leaving..." : "Leave project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Invite Member Dialog */}
      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        projectId={project.id}
        projectName={project.name}
        availableUsers={availableUsers}
        currentMemberIds={project.memberIds}
      />

      {/* Collaborate Dialog */}
      <CollaborateDialog
        open={collabOpen}
        onOpenChange={setCollabOpen}
        projectId={project.id}
        projectName={project.name}
        ownerName={ownerName}
        onSuccess={() => setPendingApplication(true)}
      />

      {/* Edit Project Dialog */}
      <EditProjectDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        project={project}
        availableSkills={availableSkills}
      />
    </>
  );
}