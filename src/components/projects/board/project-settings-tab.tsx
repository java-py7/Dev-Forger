"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { updateProject, deleteProject } from "@/app/(dashboard)/projects/actions";
import { PROJECT_CATEGORIES } from "@/components/projects/create-project-dialog";

type ProjectSettingsTabProps = {
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
  };
  isOwner: boolean;
};

export function ProjectSettingsTab({ project, isOwner }: ProjectSettingsTabProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [category, setCategory] = useState(project.category || "");
  const [language, setLanguage] = useState(project.language || "");
  const [visibility, setVisibility] = useState(project.visibility);
  const [status, setStatus] = useState(project.status);
  const [repositoryUrl, setRepositoryUrl] = useState(project.repositoryUrl || "");
  const [websiteUrl, setWebsiteUrl] = useState(project.websiteUrl || "");
  const [maxMembers, setMaxMembers] = useState(
    project.maxMembers ? String(project.maxMembers) : ""
  );

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;

    setLoading(true);
    setError("");
    setSuccess(false);

    const formData = new FormData();
    formData.append("projectId", project.id);
    formData.append("name", name);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("language", language);
    formData.append("visibility", visibility);
    formData.append("status", status);
    formData.append("repositoryUrl", repositoryUrl);
    formData.append("websiteUrl", websiteUrl);
    formData.append("maxMembers", maxMembers);

    try {
      const res = await updateProject(formData);
      if (res.success) {
        setSuccess(true);
        router.refresh();
      } else {
        setError(res.error || "Failed to update project settings.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isOwner) return;
    setDeleteLoading(true);

    try {
      const res = await deleteProject(project.id);
      if (res.success) {
        router.push("/projects");
      } else {
        setError(res.error || "Failed to delete project.");
        setDeleteOpen(false);
      }
    } catch {
      setError("Failed to delete project.");
      setDeleteOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!isOwner) {
    return (
      <Card className="border-border/60">
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Only the project owner has access to modify project settings.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            General Settings
          </CardTitle>
          <CardDescription>
            Update project metadata and visibility.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-400">
                Project settings updated successfully.
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="proj-name">Project Name *</Label>
              <Input
                id="proj-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="proj-desc">Description</Label>
              <Textarea
                id="proj-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="proj-vis">Visibility</Label>
                <select
                  id="proj-vis"
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  disabled={loading}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="PUBLIC">Public</option>
                  <option value="PRIVATE">Private</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="proj-status">Status</Label>
                <select
                  id="proj-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={loading}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="PLANNING">Planning</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="proj-category">Category</Label>
                <select
                  id="proj-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={loading}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select a category</option>
                  {PROJECT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="proj-lang">Primary Language</Label>
                <Input
                  id="proj-lang"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder="TypeScript, Python, Go..."
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="proj-repo">Repository URL</Label>
                <Input
                  id="proj-repo"
                  value={repositoryUrl}
                  onChange={(e) => setRepositoryUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="proj-site">Live Website URL</Label>
                <Input
                  id="proj-site"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://..."
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={loading} className="gap-2 text-xs">
                {loading && <Loader2 className="size-3.5 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-destructive">
            Danger Zone
          </CardTitle>
          <CardDescription>
            Permanently delete this project, board, tasks, and all associated workspace data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            className="gap-2 text-xs"
          >
            <Trash2 className="size-3.5" />
            Delete Project
          </Button>
        </CardContent>
      </Card>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-foreground">{project.name}</span>?
              This will erase all tasks, columns, files, and project membership. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
            >
              {deleteLoading && <Loader2 className="size-4 animate-spin" />}
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
