"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { DeploymentStatus, BuildStatus } from "@prisma/client";

// ============================================================
// TYPES
// ============================================================

export type BuildItem = {
  id: string;
  deploymentId: string;
  status: BuildStatus;
  logs: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
};

export type DeploymentItem = {
  id: string;
  projectId: string;
  userId: string;
  status: DeploymentStatus;
  url: string | null;
  environment: "PRODUCTION" | "PREVIEW" | "DEVELOPMENT";
  trigger: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    username: string | null;
  };
  builds: BuildItem[];
};

export type DeploymentOverviewStats = {
  totalDeployments: number;
  latestDeployment: DeploymentItem | null;
  lastSuccessfulDeployment: DeploymentItem | null;
  productionStatus: DeploymentStatus | "NO_DEPLOYMENTS";
  isProviderConfigured: boolean;
  providerName: string | null;
  activeEnvironment: string;
};

export type ProjectDeploymentsData = {
  project: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    visibility: string;
    ownerId: string;
    repositoryUrl: string | null;
    websiteUrl: string | null;
  };
  deployments: DeploymentItem[];
  stats: DeploymentOverviewStats;
  canDeploy: boolean;
  isOwner: boolean;
};

type TriggerDeploymentResponse = {
  success: boolean;
  error?: string;
  notConfigured?: boolean;
  deployment?: DeploymentItem;
};

// ============================================================
// HELPERS
// ============================================================

function checkProviderConfiguration(): {
  isConfigured: boolean;
  providerName: string | null;
} {
  // Inspect project environment for configured cloud deployment providers
  const hasVercel = Boolean(process.env.VERCEL_TOKEN);
  const hasAws = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
  const hasCloudflare = Boolean(process.env.CLOUDFLARE_API_TOKEN);
  const hasWebhook = Boolean(process.env.DEPLOYMENT_WEBHOOK_URL);

  if (hasVercel) return { isConfigured: true, providerName: "Vercel" };
  if (hasAws) return { isConfigured: true, providerName: "AWS" };
  if (hasCloudflare) return { isConfigured: true, providerName: "Cloudflare" };
  if (hasWebhook) return { isConfigured: true, providerName: "Custom Webhook" };

  return { isConfigured: false, providerName: null };
}

// ============================================================
// GET PROJECT DEPLOYMENTS DATA
// ============================================================

export async function getProjectDeploymentsData(
  slug: string
): Promise<{ success: boolean; data?: ProjectDeploymentsData; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized. Please sign in." };
  }

  const userId = session.user.id;

  try {
    const project = await prisma.project.findUnique({
      where: { slug },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                username: true,
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
    const member = project.members.find((m) => m.userId === userId);
    const isMember = !!member;
    const isPublic = project.visibility === "PUBLIC";

    if (!isOwner && !isMember && !isPublic) {
      return { success: false, error: "Access denied to project deployments." };
    }

    const canDeploy =
      isOwner ||
      (isMember && (member.role === "OWNER" || member.role === "ADMIN" || member.role === "DEVELOPER"));

    // Fetch real deployments from Prisma
    const deploymentsRaw = await prisma.deployment.findMany({
      where: {
        projectId: project.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            username: true,
          },
        },
        builds: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    // Check deployment provider configuration
    const { isConfigured: isProviderConfigured, providerName } =
      checkProviderConfiguration();

    const deployments: DeploymentItem[] = deploymentsRaw.map((d) => {
      // Map build items
      const builds: BuildItem[] = d.builds.map((b) => ({
        id: b.id,
        deploymentId: b.deploymentId,
        status: b.status,
        logs: b.logs,
        startedAt: b.startedAt ? b.startedAt.toISOString() : null,
        finishedAt: b.finishedAt ? b.finishedAt.toISOString() : null,
        createdAt: b.createdAt.toISOString(),
      }));

      // Infer environment from URL or default to PRODUCTION
      let environment: "PRODUCTION" | "PREVIEW" | "DEVELOPMENT" = "PRODUCTION";
      if (d.url && (d.url.includes("preview") || d.url.includes("-git-"))) {
        environment = "PREVIEW";
      } else if (d.url && d.url.includes("dev")) {
        environment = "DEVELOPMENT";
      }

      return {
        id: d.id,
        projectId: d.projectId,
        userId: d.userId,
        status: d.status,
        url: d.url,
        environment,
        trigger: "Manual - Web Dashboard",
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
        user: d.user,
        builds,
      };
    });

    const latestDeployment = deployments[0] || null;
    const lastSuccessfulDeployment =
      deployments.find((d) => d.status === "READY") || null;

    const productionStatus: DeploymentStatus | "NO_DEPLOYMENTS" =
      deployments.length > 0 ? deployments[0].status : "NO_DEPLOYMENTS";

    const stats: DeploymentOverviewStats = {
      totalDeployments: deployments.length,
      latestDeployment,
      lastSuccessfulDeployment,
      productionStatus,
      isProviderConfigured,
      providerName,
      activeEnvironment: "Production",
    };

    return {
      success: true,
      data: {
        project: {
          id: project.id,
          name: project.name,
          slug: project.slug,
          description: project.description,
          visibility: project.visibility,
          ownerId: project.ownerId,
          repositoryUrl: project.repositoryUrl,
          websiteUrl: project.websiteUrl,
        },
        deployments,
        stats,
        canDeploy,
        isOwner,
      },
    };
  } catch (err) {
    console.error("Error in getProjectDeploymentsData:", err);
    return { success: false, error: "Failed to load project deployments." };
  }
}

// ============================================================
// TRIGGER PROJECT DEPLOYMENT ACTION
// ============================================================

export async function triggerProjectDeploymentAction(
  projectId: string,
  environment: "PRODUCTION" | "PREVIEW" | "DEVELOPMENT" = "PRODUCTION"
): Promise<TriggerDeploymentResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized. Please sign in." };
  }

  const userId = session.user.id;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!project) {
      return { success: false, error: "Project not found." };
    }

    const isOwner = project.ownerId === userId;
    const isMember = project.members.length > 0;
    const canDeploy =
      isOwner ||
      (isMember && (project.members[0].role === "OWNER" || project.members[0].role === "ADMIN" || project.members[0].role === "DEVELOPER"));

    if (!canDeploy) {
      return { success: false, error: "You do not have permission to trigger deployments for this project." };
    }

    const { isConfigured } = checkProviderConfiguration();

    // If real deployment infrastructure is not connected, do NOT simulate a fake deployment
    if (!isConfigured) {
      return {
        success: false,
        notConfigured: true,
        error:
          "Deployment provider not configured. Connect a cloud provider (such as Vercel, AWS, or build webhook) to trigger deployments.",
      };
    }

    // Provider is configured: create real Deployment and Build records in Prisma
    const deployment = await prisma.deployment.create({
      data: {
        projectId: project.id,
        userId,
        status: "QUEUED",
        builds: {
          create: {
            status: "QUEUED",
            logs: `[DevForge Deploy] Deployment initiated for environment: ${environment}\n[DevForge Deploy] Queued build pipeline for project: ${project.name}`,
            startedAt: new Date(),
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            username: true,
          },
        },
        builds: true,
      },
    });

    // Log real project activity
    await prisma.projectActivity.create({
      data: {
        projectId: project.id,
        userId,
        action: "DEPLOYMENT_TRIGGERED",
        metadata: {
          deploymentId: deployment.id,
          environment,
          status: "QUEUED",
        },
      },
    });

    // Notify project members
    try {
      const recipientIds = project.members
        .map((m) => m.userId)
        .concat(isOwner ? [] : [project.ownerId])
        .filter((id) => id !== userId);

      if (recipientIds.length > 0) {
        await prisma.notification.createMany({
          data: recipientIds.map((recipientId) => ({
            userId: recipientId,
            type: "DEPLOYMENT",
            title: "Deployment Triggered",
            message: `${session.user?.name || "A team member"} triggered a ${environment.toLowerCase()} deployment for ${project.name}.`,
          })),
        });
      }
    } catch {
      // Non-blocking notification error
    }

    revalidatePath("/deployments");

    const deploymentItem: DeploymentItem = {
      id: deployment.id,
      projectId: deployment.projectId,
      userId: deployment.userId,
      status: deployment.status,
      url: deployment.url,
      environment,
      trigger: "Manual - Web Dashboard",
      createdAt: deployment.createdAt.toISOString(),
      updatedAt: deployment.updatedAt.toISOString(),
      user: deployment.user,
      builds: deployment.builds.map((b) => ({
        id: b.id,
        deploymentId: b.deploymentId,
        status: b.status,
        logs: b.logs,
        startedAt: b.startedAt ? b.startedAt.toISOString() : null,
        finishedAt: b.finishedAt ? b.finishedAt.toISOString() : null,
        createdAt: b.createdAt.toISOString(),
      })),
    };

    return {
      success: true,
      deployment: deploymentItem,
    };
  } catch (err) {
    console.error("Error triggering deployment:", err);
    return {
      success: false,
      error: "An unexpected error occurred while initiating deployment.",
    };
  }
}

// ============================================================
// CANCEL DEPLOYMENT ACTION
// ============================================================

export async function cancelDeploymentAction(
  deploymentId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized. Please sign in." };
  }

  const userId = session.user.id;

  try {
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      include: {
        project: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!deployment) {
      return { success: false, error: "Deployment not found." };
    }

    const isOwner = deployment.project.ownerId === userId;
    const isMember = deployment.project.members.length > 0;
    const canCancel =
      isOwner ||
      deployment.userId === userId ||
      (isMember && deployment.project.members[0].role !== "VIEWER");

    if (!canCancel) {
      return { success: false, error: "You do not have permission to cancel this deployment." };
    }

    await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status: "CANCELLED",
        builds: {
          updateMany: {
            where: {
              status: {
                in: ["QUEUED", "RUNNING"],
              },
            },
            data: {
              status: "CANCELLED",
              finishedAt: new Date(),
            },
          },
        },
      },
    });

    revalidatePath("/deployments");
    return { success: true };
  } catch (err) {
    console.error("Error cancelling deployment:", err);
    return { success: false, error: "Failed to cancel deployment." };
  }
}
