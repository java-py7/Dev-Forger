"use client";

import { useState } from "react";
import {
  Calendar,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowRight,
  AlertCircle,
  Bug,
  Sparkles,
  CheckCircle2,
  Bookmark,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BoardTask, BoardColumnWithTasks } from "@/app/(dashboard)/projects/[slug]/task-actions";

type TaskCardProps = {
  task: BoardTask;
  columns: BoardColumnWithTasks[];
  canEdit: boolean;
  onEdit: (task: BoardTask) => void;
  onDelete: (taskId: string) => void;
  onMoveColumn: (taskId: string, targetColumnId: string) => void;
};

export function TaskCard({
  task,
  columns,
  canEdit,
  onEdit,
  onDelete,
  onMoveColumn,
}: TaskCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  // Drag handlers for HTML5 DnD
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (!canEdit) return;
    setIsDragging(true);
    e.dataTransfer.setData("text/plain", task.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const formatDueDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const isOverdue = date < now;
      const formatted = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      return { formatted, isOverdue };
    } catch {
      return { formatted: dateStr, isOverdue: false };
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return (
          <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-red-500/15 text-red-500 border border-red-500/30">
            <AlertCircle className="size-2.5" />
            Urgent
          </span>
        );
      case "HIGH":
        return (
          <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30">
            High
          </span>
        );
      case "MEDIUM":
        return (
          <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30">
            Medium
          </span>
        );
      case "LOW":
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground border border-border">
            Low
          </span>
        );
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "BUG":
        return (
          <Tooltip>
            <TooltipTrigger className="text-rose-400 inline-flex items-center">
              <Bug className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent side="top">Bug</TooltipContent>
          </Tooltip>
        );
      case "FEATURE":
        return (
          <Tooltip>
            <TooltipTrigger className="text-purple-400 inline-flex items-center">
              <Sparkles className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent side="top">Feature</TooltipContent>
          </Tooltip>
        );
      case "IMPROVEMENT":
        return (
          <Tooltip>
            <TooltipTrigger className="text-cyan-400 inline-flex items-center">
              <CheckCircle2 className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent side="top">Improvement</TooltipContent>
          </Tooltip>
        );
      case "TASK":
      default:
        return (
          <Tooltip>
            <TooltipTrigger className="text-muted-foreground inline-flex items-center">
              <Bookmark className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent side="top">Task</TooltipContent>
          </Tooltip>
        );
    }
  };

  const otherColumns = columns.filter((col) => col.id !== task.boardColumnId);
  const dueInfo = task.dueDate ? formatDueDate(task.dueDate) : null;

  return (
    <div
      draggable={canEdit}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onEdit(task)}
      className={`group relative flex flex-col justify-between rounded-lg border bg-card p-3 shadow-sm transition-all hover:border-foreground/25 hover:shadow-md cursor-pointer ${
        isDragging ? "opacity-40 ring-2 ring-primary scale-95" : ""
      }`}
    >
      {/* Top row: Type, Priority, and Quick Actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {getTypeIcon(task.type)}
          {getPriorityBadge(task.priority)}
        </div>

        {canEdit && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <DropdownMenu>
              <DropdownMenuTrigger className="flex size-6 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <MoreHorizontal className="size-3.5" />
                <span className="sr-only">Actions</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  <Pencil className="size-3.5 mr-2" />
                  Edit Task
                </DropdownMenuItem>

                {otherColumns.length > 0 && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <ArrowRight className="size-3.5 mr-2" />
                      Move to
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {otherColumns.map((col) => (
                        <DropdownMenuItem
                          key={col.id}
                          onClick={() => onMoveColumn(task.id, col.id)}
                        >
                          {col.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(task.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-3.5 mr-2" />
                  Delete Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Task Title */}
      <h4 className="mt-2 text-sm font-medium leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
        {task.title}
      </h4>

      {/* Optional Short Description */}
      {task.description && (
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Bottom row: Due Date and Assignee */}
      <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
        {dueInfo ? (
          <div
            className={`flex items-center gap-1 text-[11px] ${
              dueInfo.isOverdue ? "text-rose-400 font-medium" : "text-muted-foreground"
            }`}
            title={`Due on ${dueInfo.formatted}${dueInfo.isOverdue ? " (Overdue)" : ""}`}
          >
            <Calendar className="size-3" />
            <span>{dueInfo.formatted}</span>
          </div>
        ) : (
          <span />
        )}

        {/* Assignee Avatar */}
        {task.assignee ? (
          <Tooltip>
            <TooltipTrigger className="flex items-center gap-1.5 cursor-default">
              <Avatar className="size-5 border border-border">
                <AvatarImage src={task.assignee.image || undefined} />
                <AvatarFallback className="text-[9px] font-medium bg-primary/20 text-primary">
                  {task.assignee.name?.slice(0, 2).toUpperCase() ||
                    task.assignee.username?.slice(0, 2).toUpperCase() ||
                    "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-[11px] text-muted-foreground truncate max-w-20">
                {task.assignee.name || task.assignee.username}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs font-medium">
                {task.assignee.name || task.assignee.username}
              </p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <span className="text-[10px] text-muted-foreground/60 italic">
            Unassigned
          </span>
        )}
      </div>
    </div>
  );
}
