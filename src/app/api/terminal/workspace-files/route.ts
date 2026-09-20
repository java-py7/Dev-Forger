import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTerminalToken } from "@/lib/terminal-token";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tokenParam = searchParams.get("token");
    const authHeader = req.headers.get("authorization") || "";
    const bearerToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : null;

    const token = tokenParam || bearerToken;
    const secret = process.env.TERMINAL_AUTH_SECRET || process.env.AUTH_SECRET;

    if (!secret) {
      return NextResponse.json(
        { error: "Server authentication secret is not configured." },
        { status: 500 }
      );
    }

    let targetProjectId = searchParams.get("projectId");
    let targetProjectSlug = searchParams.get("projectSlug");

    // 1. If token is the raw server secret, allow direct project query
    if (token === secret) {
      if (!targetProjectId && !targetProjectSlug) {
        return NextResponse.json(
          { error: "projectId or projectSlug is required." },
          { status: 400 }
        );
      }
    } else if (token) {
      // 2. Otherwise verify signed token
      const payload = verifyTerminalToken(token, secret);
      if (!payload) {
        return NextResponse.json(
          { error: "Invalid or expired terminal token." },
          { status: 401 }
        );
      }
      targetProjectId = payload.projectId;
      targetProjectSlug = payload.projectSlug;
    } else {
      return NextResponse.json(
        { error: "Authentication token is required." },
        { status: 401 }
      );
    }

    const project = await prisma.project.findFirst({
      where: {
        OR: [
          ...(targetProjectId ? [{ id: targetProjectId }] : []),
          ...(targetProjectSlug ? [{ slug: targetProjectSlug }] : []),
        ],
      },
      include: {
        workspace: {
          include: {
            files: {
              select: {
                id: true,
                name: true,
                path: true,
                type: true,
                content: true,
                language: true,
                size: true,
              },
            },
          },
        },
      },
    });

    if (!project || !project.workspace) {
      return NextResponse.json(
        { error: "Project or workspace not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      projectId: project.id,
      projectSlug: project.slug,
      workspaceId: project.workspace.id,
      files: project.workspace.files.map((f) => ({
        id: f.id,
        name: f.name,
        path: f.path.replace(/\\/g, "/"),
        type: f.type,
        content: f.content || "",
        language: f.language,
        size: f.size,
      })),
    });
  } catch (error: any) {
    console.error("[Workspace Files API] Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve workspace files." },
      { status: 500 }
    );
  }
}
