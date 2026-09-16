"use client";

import { useEffect, useState } from "react";
import {
  Globe,
  MapPin,
  Briefcase,
  ExternalLink,
  Code2,
  Users,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getDeveloperProfile } from "@/app/(dashboard)/chat/actions";
import { FullDeveloperProfile } from "./types";

type DeveloperProfileDialogProps = {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeveloperProfileDialog({
  userId,
  open,
  onOpenChange,
}: DeveloperProfileDialogProps) {
  const [profile, setProfile] = useState<FullDeveloperProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && userId) {
      setLoading(true);
      getDeveloperProfile(userId)
        .then((res) => {
          if (res.success && res.profile) {
            setProfile(res.profile as unknown as FullDeveloperProfile);
          }
        })
        .finally(() => setLoading(false));
    } else if (!open) {
      setProfile(null);
    }
  }, [open, userId]);

  const initials =
    profile?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ||
    profile?.username?.slice(0, 2).toUpperCase() ||
    "DV";

  const formatAvailability = (status?: string) => {
    if (!status) return "Available";
    return status.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-white/10 bg-card p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-white/10 px-6 py-5">
          <DialogTitle className="text-base font-semibold">
            Developer Profile
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : profile ? (
          <div className="max-h-[calc(85vh-80px)] overflow-y-auto p-6 space-y-6">
            {/* Header info */}
            <div className="flex items-start gap-4">
              <Avatar className="size-16 border border-white/10">
                <AvatarImage src={profile.image || undefined} alt={profile.name || "User"} />
                <AvatarFallback className="bg-muted text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-lg font-semibold text-foreground">
                  {profile.name || "Developer"}
                </h3>
                {profile.username && (
                  <p className="text-xs text-muted-foreground">@{profile.username}</p>
                )}

                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-white/10 text-xs font-normal"
                  >
                    <span
                      className={`mr-1.5 size-2 rounded-full ${
                        profile.profile?.availability === "AVAILABLE"
                          ? "bg-emerald-500"
                          : profile.profile?.availability === "BUSY"
                          ? "bg-amber-500"
                          : "bg-muted-foreground"
                      }`}
                    />
                    {formatAvailability(profile.profile?.availability)}
                  </Badge>

                  {profile.profile?.workMode && (
                    <Badge variant="secondary" className="text-xs font-normal">
                      {profile.profile.workMode}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            {profile.profile?.bio && (
              <div>
                <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  About
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                  {profile.profile.bio}
                </p>
              </div>
            )}

            {/* Meta Links */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
              {profile.profile?.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  <span>{profile.profile.location}</span>
                </div>
              )}
              {profile.profile?.website && (
                <a
                  href={profile.profile.website.startsWith("http") ? profile.profile.website : `https://${profile.profile.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                >
                  <Globe className="size-3.5" />
                  <span>Website</span>
                  <ExternalLink className="size-3" />
                </a>
              )}
              {profile.profile?.githubUrl && (
                <a
                  href={profile.profile.githubUrl.startsWith("http") ? profile.profile.githubUrl : `https://${profile.profile.githubUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                >
                  <Code2 className="size-3.5" />
                  <span>GitHub</span>
                  <ExternalLink className="size-3" />
                </a>
              )}
              {profile.profile?.linkedinUrl && (
                <a
                  href={profile.profile.linkedinUrl.startsWith("http") ? profile.profile.linkedinUrl : `https://${profile.profile.linkedinUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                >
                  <Users className="size-3.5" />
                  <span>LinkedIn</span>
                  <ExternalLink className="size-3" />
                </a>
              )}
            </div>

            {/* Roles */}
            {profile.profile?.roles && profile.profile.roles.length > 0 && (
              <div>
                <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Roles
                </h4>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {profile.profile.roles.map((r, i) => (
                    <Badge key={i} variant="secondary" className="text-xs font-normal">
                      <Briefcase className="mr-1 size-3" />
                      {r.role.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {profile.userSkills && profile.userSkills.length > 0 && (
              <div>
                <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Skills & Technologies
                </h4>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {profile.userSkills.map((s, i) => (
                    <Badge key={i} variant="outline" className="border-white/10 text-xs font-normal">
                      {s.skill.name}
                      {s.yearsOfExperience > 0 && (
                        <span className="ml-1 text-[10px] text-muted-foreground">
                          · {s.yearsOfExperience}y
                        </span>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No profile details available.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
