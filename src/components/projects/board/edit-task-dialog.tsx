"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BoardColumnWithTasks,
  BoardTask,
  ProjectMemberItem,
  updateTaskAction,
  deleteTaskAction,
} from "@/app/(dashboard)/projects/[slug]/task-actions";
import { TaskPriority, TaskType } from "@/types/database";
import { Clock, Loader2, Trash2 } from "lucide-react";

type EditTaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: BoardTask | null;
  columns: BoardColumnWithTasks[];
  members: ProjectMemberItem[];
  canEdit: boolean;
  slug: string;
  onTaskUpdated: (task: BoardTask) => void;
  onTaskDeleted: (taskId: string) => void;
};

export function EditTaskDialog({
  open,
  onOpenChange,
  task,
  columns,
  members,
  canEdit,
  slug,
  onTaskUpdated,
  onTaskDeleted,
}: EditTaskDialogProps) {
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [columnId, setColumnId] = useState("");
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [type, setType] = useState<TaskType>(TaskType.TASK);
  const [assigneeId, setAssigneeId] = useState<string>("UNASSIGNED");
  const [dueDate, setDueDate] = useState<string>("");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setColumnId(task.boardColumnId);
      setPriority(task.priority);
      setType(task.type);
      setAssigneeId(task.assigneeId || "UNASSIGNED");
      if (task.dueDate) {
        const d = new Date(task.dueDate);
        setDueDate(d.toISOString().split("T")[0]);
      } else {
        setDueDate("");
      }
      setError("");
    }
  }, [task]);

  if (!task) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    if (!title.trim()) {
      setError("Task title cannot be empty.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await updateTaskAction(slug, task.id, {
        title: title.trim(),
        description: description.trim() || null,
        boardColumnId: columnId,
        priority,
        type,
        assigneeId: assigneeId === "UNASSIGNED" ? null : assigneeId,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      });

      if (res.success && res.task) {
        onTaskUpdated(res.task);
        onOpenChange(false);
      } else {
        setError(res.error || "Failed to update task.");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    setError("");

    try {
      const res = await deleteTaskAction(slug, task.id);
      if (res.success) {
        onTaskDeleted(task.id);
        setDeleteConfirmOpen(false);
        onOpenChange(false);
      } else {
        setError(res.error || "Failed to delete task.");
      }
    } catch {
      setError("Failed to delete task.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const formattedCreatedAt = new Date(task.createdAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <div className="flex items-center justify-between pr-4">
              <DialogTitle className="text-lg">Task Details</DialogTitle>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="size-3.5" />
                <span>Created {formattedCreatedAt}</span>
              </div>
            </div>
            <DialogDescription>
              {canEdit
                ? "View and edit details for this task."
                : "View task details."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {error && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                {error}
              </div>
            )}

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-task-title">Title *</Label>
              <Input
                id="edit-task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={!canEdit || loading}
                maxLength={255}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-task-description">Description</Label>
              <Textarea
                id="edit-task-description"
                placeholder="No description provided."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!canEdit || loading}
                rows={3}
              />
            </div>

            {/* Column & Priority Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-task-column">Status / Column</Label>
                <select
                  id="edit-task-column"
                  value={columnId}
                  onChange={(e) => setColumnId(e.target.value)}
                  disabled={!canEdit || loading}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {columns.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-task-priority">Priority</Label>
                <select
                  id="edit-task-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  disabled={!canEdit || loading}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            {/* Type & Assignee Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-task-type">Type</Label>
                <select
                  id="edit-task-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as TaskType)}
                  disabled={!canEdit || loading}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="TASK">Task</option>
                  <option value="BUG">Bug</option>
                  <option value="FEATURE">Feature</option>
                  <option value="IMPROVEMENT">Improvement</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-task-assignee">Assignee</Label>
                <select
                  id="edit-task-assignee"
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  disabled={!canEdit || loading}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="UNASSIGNED">Unassigned</option>
                  {members.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.user.name || member.user.username || member.user.email} (
                      {member.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Due Date & Creator Info Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <div className="space-y-1.5">
                <Label htmlFor="edit-task-due-date">Due Date</Label>
                <Input
                  id="edit-task-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={!canEdit || loading}
                />
              </div>

              {/* Creator display */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Created By</Label>
                <div className="flex h-10 items-center gap-2 rounded-md border bg-muted/30 px-3 text-xs text-muted-foreground">
                  <Avatar className="size-5 border">
                    <AvatarImage src={task.creator.image || undefined} />
                    <AvatarFallback className="text-[9px]">
                      {task.creator.name?.slice(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">
                    {task.creator.name || task.creator.username || "Creator"}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 pt-4 border-t">
              {canEdit ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteConfirmOpen(true)}
                  disabled={loading}
                  className="gap-1.5"
                >
                  <Trash2 className="size-3.5" />
                  Delete Task
                </Button>
              ) : (
                <div />
              )}

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Close
                </Button>
                {canEdit && (
                  <Button type="submit" size="sm" disabled={loading} className="gap-2">
                    {loading && <Loader2 className="size-3.5 animate-spin" />}
                    Save Changes
                  </Button>
                )}
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-foreground">&quot;{task.title}&quot;</span>?
              This action cannot be undone.
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
              Delete Task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
