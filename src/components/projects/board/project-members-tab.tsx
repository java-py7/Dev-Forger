"use client";

import { UserPlus, Shield, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectMemberItem } from "@/app/(dashboard)/projects/[slug]/task-actions";

type ProjectMembersTabProps = {
  members: ProjectMemberItem[];
  canInvite: boolean;
  onInviteClick: () => void;
};

export function ProjectMembersTab({
  members,
  canInvite,
  onInviteClick,
}: ProjectMembersTabProps) {
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "OWNER":
        return "default";
      case "ADMIN":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Project Members</h2>
          <p className="text-xs text-muted-foreground">
            Collaborators who have access to this project workspace and Kanban board.
          </p>
        </div>

        {canInvite && (
          <Button size="sm" onClick={onInviteClick} className="gap-1.5 text-xs">
            <UserPlus className="size-3.5" />
            Invite Member
          </Button>
        )}
      </div>

      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {members.map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <Avatar className="size-9 border">
                    <AvatarImage src={member.user.image || undefined} />
                    <AvatarFallback className="text-xs font-medium">
                      {member.user.name?.slice(0, 2).toUpperCase() ||
                        member.user.username?.slice(0, 2).toUpperCase() ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">
                        {member.user.name || member.user.username || "Member"}
                      </span>
                      {member.role === "OWNER" && (
                        <Shield className="size-3 text-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {member.user.email || member.user.username || "No email"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge
                    variant={getRoleBadgeVariant(member.role)}
                    className="text-[11px] font-normal"
                  >
                    {member.role}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
