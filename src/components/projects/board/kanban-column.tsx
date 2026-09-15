"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BoardColumnWithTasks, BoardTask } from "@/app/(dashboard)/projects/[slug]/task-actions";
import { TaskCard } from "./task-card";

type KanbanColumnProps = {
  column: BoardColumnWithTasks;
  allColumns: BoardColumnWithTasks[];
  canEdit: boolean;
  onAddTask: (columnId: string) => void;
  onEditTask: (task: BoardTask) => void;
  onDeleteTask: (taskId: string) => void;
  onMoveColumn: (taskId: string, targetColumnId: string) => void;
  onDropTask: (taskId: string, targetColumnId: string) => void;
};

export function KanbanColumn({
  column,
  allColumns,
  canEdit,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onMoveColumn,
  onDropTask,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!canEdit) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!isDragOver) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Check if we're actually leaving the column container
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!canEdit) return;
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) {
      onDropTask(taskId, column.id);
    }
  };

  // Status color pill
  const getStatusColor = (name: string) => {
    switch (name.toUpperCase()) {
      case "TODO":
      case "TO DO":
        return "bg-slate-400";
      case "IN PROGRESS":
        return "bg-blue-500";
      case "IN REVIEW":
        return "bg-amber-500";
      case "DONE":
        return "bg-emerald-500";
      default:
        return column.color ? "" : "bg-primary";
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col w-72 sm:w-80 shrink-0 rounded-xl border bg-muted/25 transition-colors ${
        isDragOver
          ? "border-primary/50 bg-primary/5 ring-2 ring-primary/20"
          : "border-border/60"
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-border/40">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`size-2 rounded-full shrink-0 ${getStatusColor(column.name)}`}
            style={column.color ? { backgroundColor: column.color } : undefined}
          />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
            {column.name}
          </h3>
          <span className="inline-flex size-5 items-center justify-center rounded-full bg-muted text-[11px] font-medium text-muted-foreground">
            {column.tasks.length}
          </span>
        </div>

        {canEdit && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onAddTask(column.id)}
            className="size-6 text-muted-foreground hover:text-foreground"
            title={`Add task to ${column.name}`}
          >
            <Plus className="size-3.5" />
            <span className="sr-only">Add task to {column.name}</span>
          </Button>
        )}
      </div>

      {/* Task List / Drop Zone */}
      <div className="flex-1 flex flex-col gap-2.5 p-3 min-h-[320px] max-h-[calc(100vh-280px)] overflow-y-auto">
        {column.tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            columns={allColumns}
            canEdit={canEdit}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
            onMoveColumn={onMoveColumn}
          />
        ))}

        {column.tasks.length === 0 && (
          <div
            onClick={() => canEdit && onAddTask(column.id)}
            className={`flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center transition-colors ${
              canEdit
                ? "border-border/70 hover:border-foreground/30 hover:bg-muted/30 cursor-pointer"
                : "border-border/40"
            }`}
          >
            <p className="text-xs text-muted-foreground">No tasks yet</p>
            {canEdit && (
              <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline">
                <Plus className="size-3" />
                Add task
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
