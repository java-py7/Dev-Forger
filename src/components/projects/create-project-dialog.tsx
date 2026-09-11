"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

import { createProject } from "@/app/(dashboard)/projects/actions";

export type AvailableSkill = {
  id: string;
  name: string;
  category?: string | null;
};

type CreateProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableSkills?: AvailableSkill[];
};

export const PROJECT_CATEGORIES = [
  "Website",
  "Web Application",
  "Mobile App",
  "Backend / API",
  "Full Stack",
  "AI / Machine Learning",
  "Game Development",
  "Developer Tool / CLI",
  "Open Source Library",
  "Other",
];

export function CreateProjectDialog({
  open,
  onOpenChange,
  availableSkills = [],
}: CreateProjectDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    const form = event.currentTarget;

    setLoading(true);
    setError("");

    const formData = new FormData(form);

    const result = await createProject(formData);

    if (!result.success) {
      setError(result.error || "Something went wrong.");
      setLoading(false);
      return;
    }

    form.reset();
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
          <DialogTitle>Create project</DialogTitle>

          <DialogDescription>
            Create a project and start building with other developers.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="project-name">
              Project name <span className="text-destructive">*</span>
            </Label>

            <Input
              id="project-name"
              name="name"
              placeholder="e.g. DevForge or CloudSync"
              required
              maxLength={100}
              disabled={loading}
            />
          </div>

          {/* Project Type / Category and Language */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project-category">
                Project type / Category
              </Label>

              <select
                id="project-category"
                name="category"
                defaultValue="Web Application"
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
              <Label htmlFor="project-language">
                Primary Language / Tech
              </Label>

              {availableSkills.length > 0 ? (
                <select
                  id="project-language"
                  name="language"
                  defaultValue="TypeScript"
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
                  id="project-language"
                  name="language"
                  placeholder="e.g. TypeScript, Python, Rust"
                  disabled={loading}
                />
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="project-description">
              Description
            </Label>

            <Textarea
              id="project-description"
              name="description"
              placeholder="What is this project about? What are you building and who are you looking to work with?"
              rows={3}
              maxLength={1000}
              disabled={loading}
            />
          </div>

          {/* URLs: Repository & Website */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project-repository">
                Repository URL (optional)
              </Label>

              <Input
                id="project-repository"
                name="repositoryUrl"
                type="url"
                placeholder="https://github.com/..."
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-website">
                Live Website / Demo (optional)
              </Label>

              <Input
                id="project-website"
                name="websiteUrl"
                type="url"
                placeholder="https://..."
                disabled={loading}
              />
            </div>
          </div>

          {/* Visibility and Status */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project-visibility">
                Visibility
              </Label>

              <select
                id="project-visibility"
                name="visibility"
                defaultValue="PUBLIC"
                disabled={loading}
                className="flex h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:border-ring"
              >
                <option value="PUBLIC">
                  Public (visible to everyone)
                </option>

                <option value="PRIVATE">
                  Private (team members only)
                </option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-status">
                Status
              </Label>

              <select
                id="project-status"
                name="status"
                defaultValue="PLANNING"
                disabled={loading}
                className="flex h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:border-ring"
              >
                <option value="PLANNING">
                  Planning
                </option>

                <option value="ACTIVE">
                  Active
                </option>
              </select>
            </div>
          </div>

          {/* Maximum members */}
          <div className="space-y-2">
            <Label htmlFor="project-max-members">
              Maximum team members
            </Label>

            <Input
              id="project-max-members"
              name="maxMembers"
              type="number"
              min={1}
              max={1000}
              placeholder="e.g. 5 (leave empty for unlimited)"
              disabled={loading}
            />

            <p className="text-xs text-muted-foreground">
              Leave empty if there is no team member limit.
            </p>
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

            <Button
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Creating..."
                : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}