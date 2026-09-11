"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import { updateTeam } from "@/app/(dashboard)/teams/actions";
import { TeamData } from "@/components/teams/team-card";

type EditTeamDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: TeamData;
};

export function EditTeamDialog({
  open,
  onOpenChange,
  team,
}: EditTeamDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    setLoading(true);
    setError("");

    const formData = new FormData(form);
    const result = await updateTeam(formData);

    if (!result.success) {
      setError(result.error || "Something went wrong.");
      setLoading(false);
      return;
    }

    setLoading(false);
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!loading) {
          setError("");
          onOpenChange(value);
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Pencil className="size-4" />
            </div>
            <DialogTitle>Edit Team</DialogTitle>
          </div>
          <DialogDescription>
            Update your team name and description.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="teamId" value={team.id} />

          <div className="space-y-2">
            <Label htmlFor={`edit-team-name-${team.id}`}>
              Team name <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`edit-team-name-${team.id}`}
              name="name"
              defaultValue={team.name}
              placeholder="e.g. Core Engineering"
              required
              maxLength={100}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-team-description-${team.id}`}>
              Description
            </Label>
            <Textarea
              id={`edit-team-description-${team.id}`}
              name="description"
              defaultValue={team.description || ""}
              placeholder="What is this team's focus or mission?"
              rows={3}
              maxLength={1000}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
