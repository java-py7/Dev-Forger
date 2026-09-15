"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Code2,
  FolderKanban,
  Globe,
  KanbanSquare,
  Lock,
  Settings,
  Users,
  UserPlus,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BoardColumnWithTasks,
  ProjectMemberItem,
} from "@/app/(dashboard)/projects/[slug]/task-actions";
import {
  InviteMemberDialog,
  AvailableUser,
} from "@/components/projects/invite-member-dialog";
import { ProjectBoard } from "./project-board";
import { ProjectOverviewTab } from "./project-overview-tab";
import { ProjectMembersTab } from "./project-members-tab";
import { ProjectSettingsTab } from "./project-settings-tab";

type TabKey = "overview" | "board" | "members" | "settings";

type ProjectWorkspaceProps = {
  project: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    category: string | null;
    language: string | null;
    visibility: string;
    status: string;
    repositoryUrl: string | null;
    websiteUrl: string | null;
    maxMembers: number | null;
    createdAt: string;
    ownerId: string;
    owner: {
      id: string;
      name: string | null;
      username: string | null;
      image: string | null;
    };
  };
  initialBoard: {
    id: string;
    name: string;
    columns: BoardColumnWithTasks[];
  };
  members: ProjectMemberItem[];
  canEdit: boolean;
  isOwner: boolean;
  currentUserRole: string | null;
  availableUsers: AvailableUser[];
  defaultTab?: TabKey;
};

export function ProjectWorkspace({
  project,
  initialBoard,
  members,
  canEdit,
  isOwner,
  currentUserRole,
  availableUsers,
  defaultTab = "board",
}: ProjectWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<TabKey>(defaultTab);
  const [inviteOpen, setInviteOpen] = useState(false);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.pushState({}, "", url.toString());
      // Dispatch a custom popstate so sidebar can re-evaluate if needed
      window.dispatchEvent(new Event("popstate"));
    }
  };

  const canInvite = isOwner || currentUserRole === "ADMIN";

  const formatStatus = (s: string) => {
    switch (s) {
      case "PLANNING":
        return "Planning";
      case "ACTIVE":
        return "Active";
      case "COMPLETED":
        return "Completed";
      case "ARCHIVED":
        return "Archived";
      default:
        return s;
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)] bg-background">
      {/* Top Breadcrumb & Project Header */}
      <div className="border-b bg-card/40 px-6 py-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Breadcrumb back to projects */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
            <Link
              href="/projects"
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <FolderKanban className="size-3.5" />
              <span>Projects</span>
            </Link>
            <ChevronRight className="size-3 text-muted-foreground/60" />
            <span className="font-medium text-foreground truncate">
              {project.name}
            </span>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            {/* Project Title & Description */}
            <div className="space-y-2 max-w-3xl">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {project.name}
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {project.description ||
                  "A collaborative project workspace on DevForge."}
              </p>

              {/* Status, Visibility, Members badges row */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <Badge variant="secondary" className="text-xs font-normal">
                  {formatStatus(project.status)}
                </Badge>

                {project.visibility === "PRIVATE" ? (
                  <Badge
                    variant="outline"
                    className="gap-1 text-xs text-muted-foreground"
                  >
                    <Lock className="size-3" />
                    Private
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="gap-1 text-xs text-muted-foreground"
                  >
                    <Globe className="size-3" />
                    Public
                  </Badge>
                )}

                {/* Members avatar stack / count */}
                <div
                  onClick={() => setActiveTab("members")}
                  className="inline-flex items-center gap-1.5 rounded-md border bg-muted/30 px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                >
                  <Users className="size-3" />
                  <span>
                    {members.length}{" "}
                    {members.length === 1 ? "Member" : "Members"}
                  </span>
                </div>
              </div>
            </div>

            {/* Top Right Action Buttons: Invite + Open IDE */}
            <div className="flex items-center gap-2.5 shrink-0 pt-1">
              {canInvite && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInviteOpen(true)}
                  className="gap-1.5 text-xs h-9"
                >
                  <UserPlus className="size-3.5" />
                  <span>Invite</span>
                </Button>
              )}

              <Link
                href={`/projects/${project.slug}/code`}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                title="Launch Cloud IDE"
              >
                <Code2 className="size-3.5" />
                <span>Open IDE</span>
              </Link>
            </div>
          </div>

          {/* Navigation Tabs: [ Overview ] [ Board ] [ Members ] [ Settings ] */}
          <div className="mt-6 flex border-b border-border/60">
            <nav className="-mb-px flex gap-6" aria-label="Project tabs">
              <button
                type="button"
                onClick={() => handleTabChange("overview")}
                className={`flex items-center gap-2 border-b-2 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === "overview"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                <span>Overview</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange("board")}
                className={`flex items-center gap-2 border-b-2 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === "board"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                <KanbanSquare className="size-4" />
                <span>Board</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange("members")}
                className={`flex items-center gap-2 border-b-2 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === "members"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                <span>Members</span>
                <span className="rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-normal text-muted-foreground">
                  {members.length}
                </span>
              </button>

              {isOwner && (
                <button
                  type="button"
                  onClick={() => handleTabChange("settings")}
                  className={`flex items-center gap-2 border-b-2 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === "settings"
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                >
                  <Settings className="size-4" />
                  <span>Settings</span>
                </button>
              )}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Workspace Content Area */}
      <div className="flex-1 px-6 py-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {activeTab === "board" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight">Board</h2>
              </div>
              <ProjectBoard
                slug={project.slug}
                initialBoard={initialBoard}
                members={members}
                canEdit={canEdit}
                isOwner={isOwner}
              />
            </div>
          )}

          {activeTab === "overview" && (
            <ProjectOverviewTab
              project={project}
              columns={initialBoard.columns}
              members={members}
            />
          )}

          {activeTab === "members" && (
            <ProjectMembersTab
              members={members}
              canInvite={canInvite}
              onInviteClick={() => setInviteOpen(true)}
            />
          )}

          {activeTab === "settings" && isOwner && (
            <ProjectSettingsTab project={project} isOwner={isOwner} />
          )}
        </div>
      </div>

      {/* Real Member Invite Dialog */}
      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        projectId={project.id}
        projectName={project.name}
        availableUsers={availableUsers}
        currentMemberIds={members.map((m) => m.userId)}
      />
    </div>
  );
}
