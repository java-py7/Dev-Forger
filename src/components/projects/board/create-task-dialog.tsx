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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BoardColumnWithTasks,
  BoardTask,
  ProjectMemberItem,
  createTaskAction,
} from "@/app/(dashboard)/projects/[slug]/task-actions";
import { TaskPriority, TaskType } from "@prisma/client";
import { Loader2 } from "lucide-react";

type CreateTaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: BoardColumnWithTasks[];
  members: ProjectMemberItem[];
  defaultColumnId?: string;
  slug: string;
  onTaskCreated: (task: BoardTask) => void;
};

export function CreateTaskDialog({
  open,
  onOpenChange,
  columns,
  members,
  defaultColumnId,
  slug,
  onTaskCreated,
}: CreateTaskDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [columnId, setColumnId] = useState(defaultColumnId || columns[0]?.id || "");
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [type, setType] = useState<TaskType>(TaskType.TASK);
  const [assigneeId, setAssigneeId] = useState<string>("UNASSIGNED");
  const [dueDate, setDueDate] = useState<string>("");

  useEffect(() => {
    if (defaultColumnId) {
      setColumnId(defaultColumnId);
    } else if (columns.length > 0 && !columnId) {
      setColumnId(columns[0].id);
    }
  }, [defaultColumnId, columns, columnId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }
    if (!columnId) {
      setError("Please select a column.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await createTaskAction(slug, {
        boardColumnId: columnId,
        title: title.trim(),
        description: description.trim() || null,
        priority,
        type,
        assigneeId: assigneeId === "UNASSIGNED" ? null : assigneeId,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      });

      if (res.success && res.task) {
        onTaskCreated(res.task);
        onOpenChange(false);
        // Reset form
        setTitle("");
        setDescription("");
        setPriority(TaskPriority.MEDIUM);
        setType(TaskType.TASK);
        setAssigneeId("UNASSIGNED");
        setDueDate("");
      } else {
        setError(res.error || "Failed to create task.");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
          <DialogDescription>
            Add a new task to your project board.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Title *</Label>
            <Input
              id="task-title"
              placeholder="e.g. Implement authentication callback"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              autoFocus
              maxLength={255}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              placeholder="Add additional context or requirements..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>

          {/* Column & Priority Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="task-column">Status / Column *</Label>
              <select
                id="task-column"
                value={columnId}
                onChange={(e) => setColumnId(e.target.value)}
                disabled={loading}
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
              <Label htmlFor="task-priority">Priority</Label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                disabled={loading}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value={TaskPriority.LOW}>Low</option>
                <option value={TaskPriority.MEDIUM}>Medium</option>
                <option value={TaskPriority.HIGH}>High</option>
                <option value={TaskPriority.URGENT}>Urgent</option>
              </select>
            </div>
          </div>

          {/* Type & Assignee Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="task-type">Type</Label>
              <select
                id="task-type"
                value={type}
                onChange={(e) => setType(e.target.value as TaskType)}
                disabled={loading}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value={TaskType.TASK}>Task</option>
                <option value={TaskType.BUG}>Bug</option>
                <option value={TaskType.FEATURE}>Feature</option>
                <option value={TaskType.IMPROVEMENT}>Improvement</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-assignee">Assignee</Label>
              <select
                id="task-assignee"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                disabled={loading}
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

          {/* Due Date */}
          <div className="space-y-1.5">
            <Label htmlFor="task-due-date">Due Date (Optional)</Label>
            <Input
              id="task-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={loading}
            />
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading && <Loader2 className="size-4 animate-spin" />}
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
