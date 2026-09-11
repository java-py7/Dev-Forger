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

import { updateProject } from "@/app/(dashboard)/projects/actions";
import { PROJECT_CATEGORIES, AvailableSkill } from "@/components/projects/create-project-dialog";
import { Project } from "@/components/projects/project-card";

type EditProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  availableSkills?: AvailableSkill[];
};

export function EditProjectDialog({
  open,
  onOpenChange,
  project,
  availableSkills = [],
}: EditProjectDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    setLoading(true);
    setError("");

    const formData = new FormData(form);
    const result = await updateProject(formData);

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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Pencil className="size-4" />
            </div>
            <DialogTitle>Edit project</DialogTitle>
          </div>
          <DialogDescription>
            Update project details, category, tech stack, and links.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="projectId" value={project.id} />

          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor={`edit-project-name-${project.id}`}>
              Project name <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`edit-project-name-${project.id}`}
              name="name"
              defaultValue={project.name}
              required
              maxLength={100}
              disabled={loading}
            />
          </div>

          {/* Project Type / Category and Language */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`edit-project-category-${project.id}`}>
                Project type / Category
              </Label>
              <select
                id={`edit-project-category-${project.id}`}
                name="category"
                defaultValue={project.category || "Web Application"}
                disabled={loading}
                className="flex h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:border-ring"
              >
                {PROJECT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`edit-project-language-${project.id}`}>
                Primary Language / Tech
              </Label>
              {availableSkills.length > 0 ? (
                <select
                  id={`edit-project-language-${project.id}`}
                  name="language"
                  defaultValue={project.language || ""}
                  disabled={loading}
                  className="flex h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:border-ring"
                >
                  <option value="">Select language...</option>
                  {availableSkills.map((skill) => (
                    <option key={skill.id} value={skill.name}>
                      {skill.name} {skill.category ? `(${skill.category})` : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  id={`edit-project-language-${project.id}`}
                  name="language"
                  defaultValue={project.language || ""}
                  placeholder="e.g. TypeScript, Python, Rust"
                  disabled={loading}
                />
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor={`edit-project-description-${project.id}`}>
              Description
            </Label>
            <Textarea
              id={`edit-project-description-${project.id}`}
              name="description"
              defaultValue={project.description || ""}
              placeholder="What is this project about?"
              rows={3}
              maxLength={1000}
              disabled={loading}
            />
          </div>

          {/* URLs: Repository & Website */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`edit-project-repository-${project.id}`}>
                Repository URL (optional)
              </Label>
              <Input
                id={`edit-project-repository-${project.id}`}
                name="repositoryUrl"
                type="url"
                defaultValue={project.repositoryUrl || ""}
                placeholder="https://github.com/..."
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`edit-project-website-${project.id}`}>
                Live Website / Demo (optional)
              </Label>
              <Input
                id={`edit-project-website-${project.id}`}
                name="websiteUrl"
                type="url"
                defaultValue={project.websiteUrl || ""}
                placeholder="https://..."
                disabled={loading}
              />
            </div>
          </div>

          {/* Visibility and Status */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`edit-project-visibility-${project.id}`}>
                Visibility
              </Label>
              <select
                id={`edit-project-visibility-${project.id}`}
                name="visibility"
                defaultValue={project.visibility}
                disabled={loading}
                className="flex h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:border-ring"
              >
                <option value="PUBLIC">Public (visible to everyone)</option>
                <option value="PRIVATE">Private (team members only)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`edit-project-status-${project.id}`}>
                Status
              </Label>
              <select
                id={`edit-project-status-${project.id}`}
                name="status"
                defaultValue={project.status}
                disabled={loading}
                className="flex h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:border-ring"
              >
                <option value="PLANNING">Planning</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>

          {/* Maximum members */}
          <div className="space-y-2">
            <Label htmlFor={`edit-project-max-members-${project.id}`}>
              Maximum team members
            </Label>
            <Input
              id={`edit-project-max-members-${project.id}`}
              name="maxMembers"
              type="number"
              min={1}
              max={1000}
              defaultValue={project.maxMembers ?? ""}
              placeholder="e.g. 5 (leave empty for unlimited)"
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
