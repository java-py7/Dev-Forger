import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { signTerminalToken } from "@/lib/terminal-token";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required to access terminal." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const projectId = body.projectId as string | undefined;
    const projectSlug = body.projectSlug as string | undefined;

    if (!projectId && !projectSlug) {
      return NextResponse.json(
        { error: "projectId or projectSlug is required." },
        { status: 400 }
      );
    }

    const project = await prisma.project.findFirst({
      where: {
        OR: [
          ...(projectId ? [{ id: projectId }] : []),
          ...(projectSlug ? [{ slug: projectSlug }] : []),
        ],
      },
      include: {
        members: {
          where: { userId: session.user.id },
        },
        workspace: {
          include: {
            files: {
              select: {
                id: true,
                name: true,
                path: true,
                type: true,
                content: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 }
      );
    }

    const isOwner = project.ownerId === session.user.id;
    const isMember = project.members.length > 0;
    const isPublic = project.visibility === "PUBLIC";

    if (!isOwner && !isMember && !isPublic) {
      return NextResponse.json(
        { error: "Access denied: You do not have permission to open a terminal for this project." },
        { status: 403 }
      );
    }

    // Ensure workspace exists
    let workspace = project.workspace;
    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          projectId: project.id,
          ownerId: project.ownerId,
          name: `${project.name} Workspace`,
        },
        include: {
          files: {
            select: {
              id: true,
              name: true,
              path: true,
              type: true,
              content: true,
            },
          },
        },
      });
    }

    const secret = process.env.TERMINAL_AUTH_SECRET || process.env.AUTH_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "Server authentication secret is not configured." },
        { status: 500 }
      );
    }

    const { token, expiresAt } = signTerminalToken(
      {
        userId: session.user.id,
        projectId: project.id,
        projectSlug: project.slug,
        workspaceId: workspace.id,
      },
      secret,
      300 // 5 minutes validity
    );

    return NextResponse.json({
      success: true,
      token,
      expiresAt,
      wsUrl: process.env.NEXT_PUBLIC_TERMINAL_WS_URL || null,
      projectId: project.id,
      projectSlug: project.slug,
      workspaceId: workspace.id,
      files: (workspace.files || []).map((f) => ({
        path: f.path.replace(/\\/g, "/"),
        type: f.type,
        content: f.content || "",
      })),
    });
  } catch (error: any) {
    console.error("[Terminal Session API] Error generating session:", error);
    return NextResponse.json(
      { error: "Failed to initialize terminal session." },
      { status: 500 }
    );
  }
}
