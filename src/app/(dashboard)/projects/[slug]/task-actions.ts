"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { TaskPriority, TaskType } from "@/types/database";

export type BoardTask = {
  id: string;
  boardColumnId: string;
  creatorId: string;
  assigneeId: string | null;
  title: string;
  description: string | null;
  type: TaskType;
  priority: TaskPriority;
  position: number;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  assignee: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  } | null;
};

export type BoardColumnWithTasks = {
  id: string;
  boardId: string;
  name: string;
  position: number;
  color: string | null;
  tasks: BoardTask[];
};

export type ProjectMemberItem = {
  id: string;
  userId: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
    email: string | null;
  };
};

export type ProjectBoardData = {
  board: {
    id: string;
    name: string;
    columns: BoardColumnWithTasks[];
  };
  members: ProjectMemberItem[];
  canEdit: boolean;
  isOwner: boolean;
  currentUserRole: string | null;
};

const DEFAULT_COLUMNS = [
  { name: "TODO", position: 1000, color: "#64748b" },
  { name: "IN PROGRESS", position: 2000, color: "#3b82f6" },
  { name: "IN REVIEW", position: 3000, color: "#eab308" },
  { name: "DONE", position: 4000, color: "#22c55e" },
];

/**
 * Ensures the project has a Board and the 4 default columns.
 * Retrieves all columns and tasks sorted by position.
 */
export async function getProjectBoard(slug: string): Promise<{
  success: boolean;
  data?: ProjectBoardData;
  error?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to view this board." };
  }

  const userId = session.user.id;

  try {
    const project = await prisma.project.findUnique({
      where: { slug },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
                email: true,
              },
            },
          },
          orderBy: {
            joinedAt: "asc",
          },
        },
        board: {
          include: {
            columns: {
              orderBy: {
                position: "asc",
              },
              include: {
                tasks: {
                  orderBy: {
                    position: "asc",
                  },
                  include: {
                    creator: {
                      select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                      },
                    },
                    assignee: {
                      select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!project) {
      return { success: false, error: "Project not found." };
    }

    const isOwner = project.ownerId === userId;
    const userMembership = project.members.find((m) => m.userId === userId);
    const isMember = !!userMembership;
    const isPublic = project.visibility === "PUBLIC";

    if (!isOwner && !isMember && !isPublic) {
      return { success: false, error: "You do not have permission to view this project." };
    }

    // Permission check for mutations: Owner or members with developer/designer/admin role
    const canEdit =
      isOwner ||
      (isMember && userMembership.role !== "VIEWER");

    let board = project.board;

    // If no board exists for this project yet, create or upsert it with default columns
    if (!board) {
      try {
        board = await prisma.board.upsert({
          where: { projectId: project.id },
          create: {
            projectId: project.id,
            name: `${project.name} Board`,
            columns: {
              create: DEFAULT_COLUMNS.map((col) => ({
                name: col.name,
                position: col.position,
                color: col.color,
              })),
            },
          },
          update: {},
          include: {
            columns: {
              orderBy: {
                position: "asc",
              },
              include: {
                tasks: {
                  orderBy: {
                    position: "asc",
                  },
                  include: {
                    creator: {
                      select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                      },
                    },
                    assignee: {
                      select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });
      } catch {
        // In case of concurrent creation, query the existing board
        board = await prisma.board.findUnique({
          where: { projectId: project.id },
          include: {
            columns: {
              orderBy: {
                position: "asc",
              },
              include: {
                tasks: {
                  orderBy: {
                    position: "asc",
                  },
                  include: {
                    creator: {
                      select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                      },
                    },
                    assignee: {
                      select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });
      }
    }

    if (!board) {
      return { success: false, error: "Failed to load or initialize project board." };
    }

    if (board.columns.length === 0) {
      // Board exists but has no columns: initialize default columns
      try {
        await prisma.boardColumn.createMany({
          data: DEFAULT_COLUMNS.map((col) => ({
            boardId: board!.id,
            name: col.name,
            position: col.position,
            color: col.color,
          })),
        });
      } catch {
        // Ignore if created concurrently
      }

      const updatedColumns = await prisma.boardColumn.findMany({
        where: { boardId: board.id },
        orderBy: { position: "asc" },
        include: {
          tasks: {
            orderBy: { position: "asc" },
            include: {
              creator: {
                select: { id: true, name: true, username: true, image: true },
              },
              assignee: {
                select: { id: true, name: true, username: true, image: true },
              },
            },
          },
        },
      });

      board.columns = updatedColumns;
    }

    // Combine owner and members for assignee selection
    const allMembers: ProjectMemberItem[] = [
      {
        id: `owner-${project.owner.id}`,
        userId: project.owner.id,
        role: "OWNER",
        user: project.owner,
      },
      ...project.members.filter((m) => m.userId !== project.ownerId),
    ];

    const formattedColumns: BoardColumnWithTasks[] = board.columns.map((col) => ({
      id: col.id,
      boardId: col.boardId,
      name: col.name,
      position: col.position,
      color: col.color,
      tasks: col.tasks.map((task) => ({
        id: task.id,
        boardColumnId: task.boardColumnId,
        creatorId: task.creatorId,
        assigneeId: task.assigneeId,
        title: task.title,
        description: task.description,
        type: task.type,
        priority: task.priority,
        position: task.position,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
        creator: task.creator,
        assignee: task.assignee,
      })),
    }));

    return {
      success: true,
      data: {
        board: {
          id: board.id,
          name: board.name,
          columns: formattedColumns,
        },
        members: allMembers,
        canEdit,
        isOwner,
        currentUserRole: isOwner ? "OWNER" : userMembership?.role ?? null,
      },
    };
  } catch (error) {
    console.error("Error fetching project board:", error);
    return { success: false, error: "Failed to load project board." };
  }
}

export type CreateTaskInput = {
  boardColumnId: string;
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  type?: TaskType;
  assigneeId?: string | null;
  dueDate?: string | null;
};

/**
 * Creates a new task in the specified column
 */
export async function createTaskAction(slug: string, data: CreateTaskInput) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be logged in to create a task." };
  }

  const userId = session.user.id;
  const title = data.title?.trim();

  if (!title) {
    return { success: false, error: "Task title is required." };
  }

  if (title.length > 255) {
    return { success: false, error: "Task title must be 255 characters or less." };
  }

  try {
    const project = await prisma.project.findUnique({
      where: { slug },
      include: {
        members: {
          where: { userId },
        },
        board: {
          include: {
            columns: true,
          },
        },
      },
    });

    if (!project || !project.board) {
      return { success: false, error: "Project or board not found." };
    }

    const isOwner = project.ownerId === userId;
    const isMember = project.members.length > 0;
    const userRole = project.members[0]?.role;

    if (!isOwner && (!isMember || userRole === "VIEWER")) {
      return { success: false, error: "You do not have permission to create tasks in this project." };
    }

    // Verify boardColumn belongs to this board
    const targetColumn = project.board.columns.find((c) => c.id === data.boardColumnId);
    if (!targetColumn) {
      return { success: false, error: "Target column does not exist on this board." };
    }

    // If assigneeId is provided, verify they are member or owner
    let assigneeId: string | null = null;
    if (data.assigneeId && data.assigneeId !== "UNASSIGNED") {
      const isOwnerAssignee = project.ownerId === data.assigneeId;
      const isMemberAssignee = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: project.id,
            userId: data.assigneeId,
          },
        },
      });

      if (!isOwnerAssignee && !isMemberAssignee) {
        return { success: false, error: "Assignee must be a member of this project." };
      }
      assigneeId = data.assigneeId;
    }

    // Calculate position: append to bottom of column
    const highestTask = await prisma.task.findFirst({
      where: { boardColumnId: data.boardColumnId },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const position = highestTask ? highestTask.position + 1000 : 1000;

    let parsedDueDate: Date | null = null;
    if (data.dueDate) {
      const d = new Date(data.dueDate);
      if (!isNaN(d.getTime())) {
        parsedDueDate = d;
      }
    }

    const newTask = await prisma.task.create({
      data: {
        boardColumnId: data.boardColumnId,
        creatorId: userId,
        assigneeId,
        title,
        description: data.description?.trim() || null,
        priority: data.priority || TaskPriority.MEDIUM,
        type: data.type || TaskType.TASK,
        position,
        dueDate: parsedDueDate,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });

    // Notify assignee if assigned to someone other than creator
    if (assigneeId && assigneeId !== userId) {
      await prisma.notification.create({
        data: {
          userId: assigneeId,
          type: "TASK_ASSIGNED",
          title: "New Task Assigned",
          message: `You were assigned to "${newTask.title}" in ${project.name}.`,
        },
      });
    }

    revalidatePath(`/projects/${slug}`);

    return {
      success: true,
      task: {
        id: newTask.id,
        boardColumnId: newTask.boardColumnId,
        creatorId: newTask.creatorId,
        assigneeId: newTask.assigneeId,
        title: newTask.title,
        description: newTask.description,
        type: newTask.type,
        priority: newTask.priority,
        position: newTask.position,
        dueDate: newTask.dueDate ? newTask.dueDate.toISOString() : null,
        createdAt: newTask.createdAt.toISOString(),
        updatedAt: newTask.updatedAt.toISOString(),
        creator: newTask.creator,
        assignee: newTask.assignee,
      },
    };
  } catch (error) {
    console.error("Create task error:", error);
    return { success: false, error: "Failed to create task. Please try again." };
  }
}

export type UpdateTaskInput = {
  title?: string;
  description?: string | null;
  boardColumnId?: string;
  priority?: TaskPriority;
  type?: TaskType;
  assigneeId?: string | null;
  dueDate?: string | null;
};

/**
 * Updates an existing task's fields
 */
export async function updateTaskAction(
  slug: string,
  taskId: string,
  data: UpdateTaskInput
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be logged in to update a task." };
  }

  const userId = session.user.id;

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        boardColumn: {
          include: {
            board: {
              include: {
                project: {
                  include: {
                    members: {
                      where: { userId },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!task) {
      return { success: false, error: "Task not found." };
    }

    const project = task.boardColumn.board.project;
    const isOwner = project.ownerId === userId;
    const isMember = project.members.length > 0;
    const userRole = project.members[0]?.role;

    if (!isOwner && (!isMember || userRole === "VIEWER")) {
      return { success: false, error: "You do not have permission to edit this task." };
    }

    const updateData: {
      title?: string;
      description?: string | null;
      boardColumnId?: string;
      priority?: TaskPriority;
      type?: TaskType;
      assigneeId?: string | null;
      dueDate?: Date | null;
    } = {};

    if (data.title !== undefined) {
      const cleanTitle = data.title.trim();
      if (!cleanTitle) {
        return { success: false, error: "Task title cannot be empty." };
      }
      updateData.title = cleanTitle;
    }

    if (data.description !== undefined) {
      updateData.description = data.description ? data.description.trim() : null;
    }

    if (data.priority !== undefined) {
      updateData.priority = data.priority;
    }

    if (data.type !== undefined) {
      updateData.type = data.type;
    }

    if (data.boardColumnId !== undefined) {
      // Validate that target column is in the same board
      const columnExists = await prisma.boardColumn.findFirst({
        where: {
          id: data.boardColumnId,
          boardId: task.boardColumn.boardId,
        },
      });
      if (!columnExists) {
        return { success: false, error: "Invalid target column." };
      }
      updateData.boardColumnId = data.boardColumnId;
    }

    if (data.assigneeId !== undefined) {
      if (data.assigneeId && data.assigneeId !== "UNASSIGNED") {
        const isOwnerAssignee = project.ownerId === data.assigneeId;
        const isMemberAssignee = await prisma.projectMember.findUnique({
          where: {
            projectId_userId: {
              projectId: project.id,
              userId: data.assigneeId,
            },
          },
        });

        if (!isOwnerAssignee && !isMemberAssignee) {
          return { success: false, error: "Assignee must be a member of this project." };
        }
        updateData.assigneeId = data.assigneeId;
      } else {
        updateData.assigneeId = null;
      }
    }

    if (data.dueDate !== undefined) {
      if (data.dueDate) {
        const d = new Date(data.dueDate);
        updateData.dueDate = !isNaN(d.getTime()) ? d : null;
      } else {
        updateData.dueDate = null;
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });

    // If assignee changed to someone new, notify them
    if (
      updateData.assigneeId &&
      updateData.assigneeId !== task.assigneeId &&
      updateData.assigneeId !== userId
    ) {
      await prisma.notification.create({
        data: {
          userId: updateData.assigneeId,
          type: "TASK_ASSIGNED",
          title: "Task Assigned",
          message: `You were assigned to "${updatedTask.title}" in ${project.name}.`,
        },
      });
    }

    revalidatePath(`/projects/${slug}`);

    return {
      success: true,
      task: {
        id: updatedTask.id,
        boardColumnId: updatedTask.boardColumnId,
        creatorId: updatedTask.creatorId,
        assigneeId: updatedTask.assigneeId,
        title: updatedTask.title,
        description: updatedTask.description,
        type: updatedTask.type,
        priority: updatedTask.priority,
        position: updatedTask.position,
        dueDate: updatedTask.dueDate ? updatedTask.dueDate.toISOString() : null,
        createdAt: updatedTask.createdAt.toISOString(),
        updatedAt: updatedTask.updatedAt.toISOString(),
        creator: updatedTask.creator,
        assignee: updatedTask.assignee,
      },
    };
  } catch (error) {
    console.error("Update task error:", error);
    return { success: false, error: "Failed to update task." };
  }
}

/**
 * Moves a task to a different column and updates its relative position
 */
export async function moveTaskAction(
  slug: string,
  taskId: string,
  targetColumnId: string,
  newPosition: number
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be logged in to move tasks." };
  }

  const userId = session.user.id;

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        boardColumn: {
          include: {
            board: {
              include: {
                project: {
                  include: {
                    members: {
                      where: { userId },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!task) {
      return { success: false, error: "Task not found." };
    }

    const project = task.boardColumn.board.project;
    const isOwner = project.ownerId === userId;
    const isMember = project.members.length > 0;
    const userRole = project.members[0]?.role;

    if (!isOwner && (!isMember || userRole === "VIEWER")) {
      return { success: false, error: "You do not have permission to move tasks in this project." };
    }

    // Verify target column is part of the same board
    const targetColumn = await prisma.boardColumn.findFirst({
      where: {
        id: targetColumnId,
        boardId: task.boardColumn.boardId,
      },
    });

    if (!targetColumn) {
      return { success: false, error: "Target column does not exist on this board." };
    }

    const isColumnChange = task.boardColumnId !== targetColumnId;

    await prisma.task.update({
      where: { id: taskId },
      data: {
        boardColumnId: targetColumnId,
        position: newPosition,
      },
    });

    if (isColumnChange) {
      // Notify assignee if someone else moved it; otherwise notify creator if someone else moved it
      const recipientId =
        task.assigneeId && task.assigneeId !== userId
          ? task.assigneeId
          : task.creatorId !== userId
          ? task.creatorId
          : null;

      if (recipientId) {
        await prisma.notification.create({
          data: {
            userId: recipientId,
            type: "TASK_UPDATED",
            title: "Task Updated",
            message: `"${task.title}" was moved to ${targetColumn.name}.`,
          },
        });
      }
    }

    revalidatePath(`/projects/${slug}`);

    return { success: true };
  } catch (error) {
    console.error("Move task error:", error);
    return { success: false, error: "Failed to move task." };
  }
}

/**
 * Deletes a task from the database
 */
export async function deleteTaskAction(slug: string, taskId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be logged in to delete a task." };
  }

  const userId = session.user.id;

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        boardColumn: {
          include: {
            board: {
              include: {
                project: {
                  include: {
                    members: {
                      where: { userId },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!task) {
      return { success: false, error: "Task not found." };
    }

    const project = task.boardColumn.board.project;
    const isOwner = project.ownerId === userId;
    const isCreator = task.creatorId === userId;
    const isAdmin = project.members.some((m) => m.role === "ADMIN");

    // Only owner, admin, or task creator can delete
    if (!isOwner && !isAdmin && !isCreator) {
      return {
        success: false,
        error: "You do not have permission to delete this task.",
      };
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    revalidatePath(`/projects/${slug}`);

    return { success: true };
  } catch (error) {
    console.error("Delete task error:", error);
    return { success: false, error: "Failed to delete task." };
  }
}
