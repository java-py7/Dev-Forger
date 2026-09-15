"use client";

import { useState, useMemo, useTransition } from "react";
import {
  Plus,
  Search,
  SlidersHorizontal,
  X,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterSelect, FilterOption } from "@/components/projects/filter-select";
import {
  BoardColumnWithTasks,
  BoardTask,
  ProjectMemberItem,
  moveTaskAction,
} from "@/app/(dashboard)/projects/[slug]/task-actions";
import { KanbanColumn } from "./kanban-column";
import { CreateTaskDialog } from "./create-task-dialog";
import { EditTaskDialog } from "./edit-task-dialog";

type ProjectBoardProps = {
  slug: string;
  initialBoard: {
    id: string;
    name: string;
    columns: BoardColumnWithTasks[];
  };
  members: ProjectMemberItem[];
  canEdit: boolean;
  isOwner: boolean;
};

export function ProjectBoard({
  slug,
  initialBoard,
  members,
  canEdit,
}: ProjectBoardProps) {
  const [columns, setColumns] = useState<BoardColumnWithTasks[]>(
    initialBoard.columns
  );
  const [, startTransition] = useTransition();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Dialog State
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [targetColumnId, setTargetColumnId] = useState<string | undefined>();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<BoardTask | null>(null);

  // Filter Options
  const priorityOptions: FilterOption[] = [
    { id: "URGENT", name: "Urgent" },
    { id: "HIGH", name: "High" },
    { id: "MEDIUM", name: "Medium" },
    { id: "LOW", name: "Low" },
  ];

  const typeOptions: FilterOption[] = [
    { id: "TASK", name: "Task" },
    { id: "BUG", name: "Bug" },
    { id: "FEATURE", name: "Feature" },
    { id: "IMPROVEMENT", name: "Improvement" },
  ];

  const assigneeOptions: FilterOption[] = useMemo(() => {
    const list: FilterOption[] = [
      { id: "UNASSIGNED", name: "Unassigned" },
    ];
    members.forEach((m) => {
      list.push({
        id: m.userId,
        name: m.user.name || m.user.username || m.user.email || "Member",
      });
    });
    return list;
  }, [members]);

  // Filter tasks per column
  const filteredColumns = useMemo(() => {
    return columns.map((col) => {
      const filteredTasks = col.tasks.filter((task) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = task.title.toLowerCase().includes(q);
          const matchDesc = task.description?.toLowerCase().includes(q) || false;
          if (!matchTitle && !matchDesc) return false;
        }

        // Priority filter
        if (priorityFilter !== "ALL" && task.priority !== priorityFilter) {
          return false;
        }

        // Type filter
        if (typeFilter !== "ALL" && task.type !== typeFilter) {
          return false;
        }

        // Assignee filter
        if (assigneeFilter !== "ALL") {
          if (assigneeFilter === "UNASSIGNED") {
            if (task.assigneeId !== null) return false;
          } else if (task.assigneeId !== assigneeFilter) {
            return false;
          }
        }

        return true;
      });

      return {
        ...col,
        tasks: filteredTasks,
      };
    });
  }, [columns, searchQuery, priorityFilter, typeFilter, assigneeFilter]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    priorityFilter !== "ALL" ||
    assigneeFilter !== "ALL" ||
    typeFilter !== "ALL";

  const clearFilters = () => {
    setSearchQuery("");
    setPriorityFilter("ALL");
    setAssigneeFilter("ALL");
    setTypeFilter("ALL");
  };

  // Drag and drop / Move handler
  const handleMoveTask = async (
    taskId: string,
    targetColId: string,
    targetPosition?: number
  ) => {
    if (!canEdit) return;

    let movedTask: BoardTask | null = null;
    let sourceColId = "";

    for (const col of columns) {
      const found = col.tasks.find((t) => t.id === taskId);
      if (found) {
        movedTask = found;
        sourceColId = col.id;
        break;
      }
    }

    if (!movedTask || sourceColId === targetColId) return;

    const previousColumns = columns;

    // Calculate new position
    const targetCol = columns.find((c) => c.id === targetColId);
    const newPos =
      targetPosition ??
      (targetCol && targetCol.tasks.length > 0
        ? targetCol.tasks[targetCol.tasks.length - 1].position + 1000
        : 1000);

    const updatedTask: BoardTask = {
      ...movedTask,
      boardColumnId: targetColId,
      position: newPos,
    };

    // Optimistic UI update
    setColumns((prev) =>
      prev.map((col) => {
        if (col.id === sourceColId) {
          return {
            ...col,
            tasks: col.tasks.filter((t) => t.id !== taskId),
          };
        }
        if (col.id === targetColId) {
          return {
            ...col,
            tasks: [...col.tasks, updatedTask].sort(
              (a, b) => a.position - b.position
            ),
          };
        }
        return col;
      })
    );

    // Call server action
    startTransition(async () => {
      const res = await moveTaskAction(slug, taskId, targetColId, newPos);
      if (!res.success) {
        // Rollback
        setColumns(previousColumns);
        alert(res.error || "Failed to move task.");
      }
    });
  };

  // Open Create Dialog
  const handleOpenCreateDialog = (columnId?: string) => {
    setTargetColumnId(columnId || columns[0]?.id);
    setCreateDialogOpen(true);
  };

  // Task Created Callback
  const handleTaskCreated = (newTask: BoardTask) => {
    setColumns((prev) =>
      prev.map((col) => {
        if (col.id === newTask.boardColumnId) {
          return {
            ...col,
            tasks: [...col.tasks, newTask].sort((a, b) => a.position - b.position),
          };
        }
        return col;
      })
    );
  };

  // Open Edit Dialog
  const handleOpenEditDialog = (task: BoardTask) => {
    setSelectedTask(task);
    setEditDialogOpen(true);
  };

  // Task Updated Callback
  const handleTaskUpdated = (updatedTask: BoardTask) => {
    setColumns((prev) =>
      prev.map((col) => {
        const hasTask = col.tasks.some((t) => t.id === updatedTask.id);

        // If task stayed in same column
        if (col.id === updatedTask.boardColumnId) {
          if (hasTask) {
            return {
              ...col,
              tasks: col.tasks.map((t) =>
                t.id === updatedTask.id ? updatedTask : t
              ),
            };
          } else {
            // Task moved to this column via edit dialog
            return {
              ...col,
              tasks: [...col.tasks, updatedTask].sort(
                (a, b) => a.position - b.position
              ),
            };
          }
        } else if (hasTask) {
          // Task was moved away from this column
          return {
            ...col,
            tasks: col.tasks.filter((t) => t.id !== updatedTask.id),
          };
        }
        return col;
      })
    );
  };

  // Task Deleted Callback
  const handleTaskDeleted = (taskId: string) => {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        tasks: col.tasks.filter((t) => t.id !== taskId),
      }))
    );
  };

  const totalTasks = useMemo(() => {
    return columns.reduce((acc, col) => acc + col.tasks.length, 0);
  }, [columns]);

  return (
    <div className="space-y-4">
      {/* SaaS Toolbar: Search, Filters, Add Task */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Right: Filters & Action Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Priority filter */}
          <FilterSelect
            value={priorityFilter}
            placeholder="All Priorities"
            options={priorityOptions}
            onChange={setPriorityFilter}
            className="w-32 [&_button]:h-9 [&_button]:text-xs"
          />

          {/* Assignee filter */}
          <FilterSelect
            value={assigneeFilter}
            placeholder="All Assignees"
            options={assigneeOptions}
            onChange={setAssigneeFilter}
            className="w-36 [&_button]:h-9 [&_button]:text-xs"
          />

          {/* Type filter */}
          <FilterSelect
            value={typeFilter}
            placeholder="All Types"
            options={typeOptions}
            onChange={setTypeFilter}
            className="w-32 [&_button]:h-9 [&_button]:text-xs"
          />

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <RotateCcw className="size-3" />
              Reset
            </Button>
          )}

          {canEdit && (
            <Button
              size="sm"
              onClick={() => handleOpenCreateDialog()}
              className="h-9 gap-1.5 text-xs font-medium"
            >
              <Plus className="size-3.5" />
              Add task
            </Button>
          )}
        </div>
      </div>

      {/* Board Columns Grid / Horizontal Scroll */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 select-none">
        {filteredColumns.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            allColumns={columns}
            canEdit={canEdit}
            onAddTask={handleOpenCreateDialog}
            onEditTask={handleOpenEditDialog}
            onDeleteTask={handleTaskDeleted}
            onMoveColumn={(taskId, targetCol) => handleMoveTask(taskId, targetCol)}
            onDropTask={(taskId, targetCol) => handleMoveTask(taskId, targetCol)}
          />
        ))}
      </div>

      {/* Empty State when no tasks exist at all */}
      {totalTasks === 0 && (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="size-6" />
          </div>
          <h3 className="mt-3 text-sm font-semibold">No tasks yet</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            Get started by organizing work for your team. Create your first task to track progress.
          </p>
          {canEdit && (
            <Button
              size="sm"
              onClick={() => handleOpenCreateDialog()}
              className="mt-4 gap-1.5 text-xs"
            >
              <Plus className="size-3.5" />
              Add task
            </Button>
          )}
        </div>
      )}

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        columns={columns}
        members={members}
        defaultColumnId={targetColumnId}
        slug={slug}
        onTaskCreated={handleTaskCreated}
      />

      {/* Edit Task Dialog */}
      <EditTaskDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        task={selectedTask}
        columns={columns}
        members={members}
        canEdit={canEdit}
        slug={slug}
        onTaskUpdated={handleTaskUpdated}
        onTaskDeleted={handleTaskDeleted}
      />
    </div>
  );
}
