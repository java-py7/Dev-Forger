import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getProjectBoard } from "@/app/(dashboard)/projects/[slug]/task-actions";
import { ProjectWorkspace } from "@/components/projects/board/project-workspace";
import { FolderKanban, KanbanSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  searchParams?: Promise<{ project?: string; tab?: string }>;
};

export default async function KanbanPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const sParams = searchParams ? await searchParams : {};

  // Find all projects the user is an owner or member of
  const userProjects = await prisma.project.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      visibility: true,
    },
  });

  // Empty state if user has no projects
  if (userProjects.length === 0) {
    return (
      <main className="min-h-full p-6 lg:p-8">
        <div className="mx-auto max-w-3xl py-16 text-center rounded-xl border border-dashed bg-card/40">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <KanbanSquare className="size-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold tracking-tight">
            No projects yet
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            You need at least one project to use the Kanban board. Create a project to start organizing tasks with your team.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/projects"
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="size-3.5" />
              <span>Create Project</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Find selected project or default to recent
  const selectedSlug =
    sParams.project || userProjects[0].slug;

  const [project, boardRes, availableUsers] = await Promise.all([
    prisma.project.findUnique({
      where: { slug: selectedSlug },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    }),
    getProjectBoard(selectedSlug),
    prisma.user.findMany({
      where: {
        id: {
          not: userId,
        },
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        email: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  if (!project || !boardRes.success || !boardRes.data) {
    redirect("/projects");
  }

  const { board, members, canEdit, isOwner, currentUserRole } = boardRes.data;

  return (
    <main className="min-h-full">
      {/* Project Switcher Bar if user has multiple projects */}
      {userProjects.length > 1 && (
        <div className="border-b bg-muted/20 px-6 py-2.5 lg:px-8">
          <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <KanbanSquare className="size-3.5 text-primary" />
              <span className="font-medium text-foreground">Project:</span>
              <div className="flex flex-wrap gap-1.5">
                {userProjects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/kanban?project=${p.slug}`}
                    className={`rounded-md px-2 py-1 text-xs transition-colors ${
                      p.slug === selectedSlug
                        ? "bg-primary text-primary-foreground font-medium"
                        : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                    }`}
                  >
                    {p.name}
                  </Link>
                ))}
              </div>
            </div>

            <Link
              href={`/projects/${project.slug}`}
              className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors shrink-0"
            >
              View Project Workspace &rarr;
            </Link>
          </div>
        </div>
      )}

      <ProjectWorkspace
        project={{
          id: project.id,
          name: project.name,
          slug: project.slug,
          description: project.description,
          category: project.category,
          language: project.language,
          visibility: project.visibility,
          status: project.status,
          repositoryUrl: project.repositoryUrl,
          websiteUrl: project.websiteUrl,
          maxMembers: project.maxMembers,
          createdAt: project.createdAt.toISOString(),
          ownerId: project.ownerId,
          owner: project.owner,
        }}
        initialBoard={board}
        members={members}
        canEdit={canEdit}
        isOwner={isOwner}
        currentUserRole={currentUserRole}
        availableUsers={availableUsers}
        defaultTab="board"
      />
    </main>
  );
}
