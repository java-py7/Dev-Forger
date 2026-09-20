import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { IdeLayout } from "@/components/editor/ide-layout";
import { WorkspaceFileItem } from "@/components/editor/types";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ProjectIdePage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { slug } = await params;
  const userId = session.user.id;

  // Query project with members and workspace
  const project = await prisma.project.findUnique({
    where: { slug },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
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
            },
          },
        },
      },
      workspace: {
        include: {
          files: {
            orderBy: {
              path: "asc",
            },
          },
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const isOwner = project.ownerId === userId;
  const isMember = project.members.some((m) => m.userId === userId);
  const isPublic = project.visibility === "PUBLIC";

  if (!isOwner && !isMember && !isPublic) {
    redirect("/projects");
  }

  const canEdit = isOwner || isMember;

  // If workspace does not exist yet for this project, create it and seed real starter files
  let workspace = project.workspace;

  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        projectId: project.id,
        ownerId: project.ownerId,
        name: `${project.name} Workspace`,
      },
      include: {
        files: true,
      },
    });
  }

  // If workspace exists but has no files yet, seed starter files into the database
  if (!workspace.files || workspace.files.length === 0) {
    const lang = project.language?.toLowerCase() || "typescript";
    let mainFileName = "index.ts";
    let mainFileLang = "typescript";
    let mainFileContent = `// DevForge Cloud IDE - ${project.name}
console.log("Hello from DevForge Cloud IDE!");

function greet(teamName: string): string {
  return \`Welcome to \${teamName}! Happy collaborating!\`;
}

console.log(greet("${project.name}"));
`;

    if (lang.includes("python") || lang === "py") {
      mainFileName = "main.py";
      mainFileLang = "python";
      mainFileContent = `# DevForge Cloud IDE - ${project.name}
def greet(name: str):
    print(f"Welcome to {name}! Happy collaborating!")

greet("${project.name}")
`;
    } else if (lang.includes("javascript") || lang === "js") {
      mainFileName = "index.js";
      mainFileLang = "javascript";
      mainFileContent = `// DevForge Cloud IDE - ${project.name}
console.log("Hello from DevForge Cloud IDE!");

function greet(teamName) {
  return "Welcome to " + teamName + "! Happy collaborating!";
}

console.log(greet("${project.name}"));
`;
    }

    const readmeContent = `# ${project.name}

${project.description || "A collaborative software project on DevForge."}

## Tech Stack
- **Language**: ${project.language || "TypeScript"}
- **Category**: ${project.category || "General"}

## Getting Started
Edit \`${mainFileName}\` and click **Run** to execute your code in the DevForge Cloud IDE.
`;

    // Create README.md
    const readmeFile = await prisma.workspaceFile.create({
      data: {
        workspaceId: workspace.id,
        name: "README.md",
        path: "README.md",
        type: "FILE",
        content: readmeContent,
        language: "markdown",
        size: Buffer.byteLength(readmeContent, "utf8"),
      },
    });

    // Create Main source file
    const mainFile = await prisma.workspaceFile.create({
      data: {
        workspaceId: workspace.id,
        name: mainFileName,
        path: mainFileName,
        type: "FILE",
        content: mainFileContent,
        language: mainFileLang,
        size: Buffer.byteLength(mainFileContent, "utf8"),
      },
    });

    workspace.files = [mainFile, readmeFile];
  }

  // Load initial files from database first as reliable baseline
  let initialFiles: WorkspaceFileItem[] = (workspace.files || []).map((f) => ({
    id: f.id,
    name: f.name,
    path: f.path.replace(/\\/g, "/"),
    type: f.type as "FILE" | "FOLDER",
    parentId: f.parentId || null,
    content: f.content,
    language: f.language,
    size: f.size,
  }));

  // Synchronize with physical workspace disk if available (e.g. local dev or writable /tmp in serverless)
  try {
    const { ensureWorkspaceDiskSync, scanWorkspaceDisk } = await import(
      "@/server/workspace-manager"
    );
    await ensureWorkspaceDiskSync(project.id);
    const scanned = await scanWorkspaceDisk(project.id);
    if (scanned && scanned.length > 0) {
      initialFiles = scanned;
    }
  } catch (err) {
    console.warn(
      "[ProjectIdePage] Disk sync bypassed or running in serverless environment:",
      err
    );
  }

  return (
    <IdeLayout
      project={{
        id: project.id,
        name: project.name,
        slug: project.slug,
        description: project.description,
        language: project.language,
        category: project.category,
        visibility: project.visibility,
        owner: project.owner,
        members: project.members,
      }}
      workspace={{
        id: workspace.id,
        name: workspace.name,
        projectId: workspace.projectId,
        ownerId: workspace.ownerId,
      }}
      initialFiles={initialFiles}
      currentUser={{
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
      }}
      canEdit={canEdit}
    />
  );
}
