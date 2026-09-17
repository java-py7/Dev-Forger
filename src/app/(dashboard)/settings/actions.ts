"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ProfileVisibility } from "@prisma/client";

export type SettingsActionResult = {
  success: boolean;
  error?: string;
};

export async function updateAccountAction(data: {
  name: string;
  username: string;
}): Promise<SettingsActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be logged in to update your account.",
    };
  }

  const userId = session.user.id;
  const name = data.name.trim();
  const rawUsername = data.username.trim();

  if (!name) {
    return {
      success: false,
      error: "Display name cannot be empty.",
    };
  }

  if (name.length > 100) {
    return {
      success: false,
      error: "Display name must be 100 characters or less.",
    };
  }

  const normalizedUsername = rawUsername.toLowerCase();

  if (normalizedUsername) {
    if (normalizedUsername.length < 3 || normalizedUsername.length > 30) {
      return {
        success: false,
        error: "Username must be between 3 and 30 characters.",
      };
    }

    if (!/^[a-z0-9_-]+$/.test(normalizedUsername)) {
      return {
        success: false,
        error: "Username can only contain letters, numbers, hyphens, and underscores.",
      };
    }

    // Check username uniqueness
    const existing = await prisma.user.findFirst({
      where: {
        username: normalizedUsername,
        id: {
          not: userId,
        },
      },
      select: { id: true },
    });

    if (existing) {
      return {
        success: false,
        error: "Username is already taken by another developer.",
      };
    }
  }

  try {
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        name,
        username: normalizedUsername || null,
      },
    });

    revalidatePath("/settings/account");
    revalidatePath("/profile");
    revalidatePath("/", "layout");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error updating account:", error);
    return {
      success: false,
      error: "Failed to update account. Please try again.",
    };
  }
}

export async function updatePrivacyAction(data: {
  visibility: ProfileVisibility;
}): Promise<SettingsActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be logged in to update privacy settings.",
    };
  }

  const userId = session.user.id;
  const allowed: ProfileVisibility[] = ["PUBLIC", "DEVELOPERS_ONLY", "PRIVATE"];

  if (!allowed.includes(data.visibility)) {
    return {
      success: false,
      error: "Invalid visibility option.",
    };
  }

  try {
    await prisma.profile.upsert({
      where: {
        userId,
      },
      create: {
        userId,
        visibility: data.visibility,
      },
      update: {
        visibility: data.visibility,
      },
    });

    revalidatePath("/settings/privacy");
    revalidatePath("/profile");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error updating privacy settings:", error);
    return {
      success: false,
      error: "Failed to update privacy settings.",
    };
  }
}

export async function revokeOtherSessionsAction(): Promise<SettingsActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be logged in to manage sessions.",
    };
  }

  const userId = session.user.id;

  try {
    const cookieStore = await cookies();
    const currentToken =
      cookieStore.get("authjs.session-token")?.value ||
      cookieStore.get("__Secure-authjs.session-token")?.value ||
      cookieStore.get("next-auth.session-token")?.value ||
      cookieStore.get("__Secure-next-auth.session-token")?.value;

    if (currentToken) {
      await prisma.session.deleteMany({
        where: {
          userId,
          sessionToken: {
            not: currentToken,
          },
        },
      });
    } else {
      // Find the most recently active session to preserve
      const latest = await prisma.session.findFirst({
        where: { userId },
        orderBy: { expires: "desc" },
      });

      if (latest) {
        await prisma.session.deleteMany({
          where: {
            userId,
            id: {
              not: latest.id,
            },
          },
        });
      }
    }

    revalidatePath("/settings/security");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error revoking other sessions:", error);
    return {
      success: false,
      error: "Failed to revoke other sessions.",
    };
  }
}
