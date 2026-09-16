"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Fetch all conversations for the authenticated user.
 */
export async function getConversations() {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be signed in to view conversations.",
      conversations: [],
    };
  }

  const userId = session.user.id;

  try {
    const rawConversations = await prisma.conversation.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
                image: true,
                profile: {
                  select: {
                    bio: true,
                    location: true,
                    website: true,
                    githubUrl: true,
                    linkedinUrl: true,
                    availability: true,
                    roles: {
                      include: {
                        role: {
                          select: {
                            id: true,
                            name: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          include: {
            sender: {
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
      orderBy: {
        updatedAt: "desc",
      },
    });

    const conversations = rawConversations.map((conv) => {
      const latestMsg = conv.messages[0] ?? null;
      return {
        id: conv.id,
        type: conv.type,
        name: conv.name,
        projectId: conv.projectId,
        project: conv.project,
        createdAt: conv.createdAt.toISOString(),
        updatedAt: conv.updatedAt.toISOString(),
        members: conv.members.map((m) => ({
          id: m.id,
          userId: m.userId,
          joinedAt: m.joinedAt.toISOString(),
          user: m.user,
        })),
        lastMessage: latestMsg
          ? {
              id: latestMsg.id,
              conversationId: latestMsg.conversationId,
              senderId: latestMsg.senderId,
              content: latestMsg.content,
              createdAt: latestMsg.createdAt.toISOString(),
              updatedAt: latestMsg.updatedAt.toISOString(),
              sender: latestMsg.sender,
            }
          : null,
      };
    });

    // Sort by latest message time, fallback to conversation updatedAt
    conversations.sort((a, b) => {
      const timeA = a.lastMessage
        ? new Date(a.lastMessage.createdAt).getTime()
        : new Date(a.updatedAt).getTime();
      const timeB = b.lastMessage
        ? new Date(b.lastMessage.createdAt).getTime()
        : new Date(b.updatedAt).getTime();
      return timeB - timeA;
    });

    return {
      success: true,
      conversations,
    };
  } catch (error) {
    console.error("[getConversations] Error:", error);
    return {
      success: false,
      error: "Failed to load conversations.",
      conversations: [],
    };
  }
}

/**
 * Fetch messages for a conversation with pagination.
 */
export async function getConversationMessages(
  conversationId: string,
  limit: number = 40,
  before?: string
) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "Unauthorized.",
      messages: [],
      hasMore: false,
    };
  }

  const userId = session.user.id;

  try {
    // Verify membership
    const membership = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!membership) {
      return {
        success: false,
        error: "You are not a participant in this conversation.",
        messages: [],
        hasMore: false,
      };
    }

    const whereClause: {
      conversationId: string;
      createdAt?: { lt: Date };
    } = {
      conversationId,
    };

    if (before) {
      whereClause.createdAt = { lt: new Date(before) };
    }

    const rawMessages = await prisma.message.findMany({
      where: whereClause,
      take: limit + 1,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });

    const hasMore = rawMessages.length > limit;
    const sliced = hasMore ? rawMessages.slice(0, limit) : rawMessages;

    // Return in chronological order (oldest first)
    const messages = sliced.reverse().map((msg) => ({
      id: msg.id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
      updatedAt: msg.updatedAt.toISOString(),
      sender: msg.sender,
    }));

    return {
      success: true,
      messages,
      hasMore,
    };
  } catch (error) {
    console.error("[getConversationMessages] Error:", error);
    return {
      success: false,
      error: "Failed to load messages.",
      messages: [],
      hasMore: false,
    };
  }
}

/**
 * Send a new message to a conversation.
 */
export async function sendMessage(conversationId: string, content: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be signed in to send messages.",
    };
  }

  const userId = session.user.id;
  const trimmed = (content || "").trim();

  if (!trimmed) {
    return {
      success: false,
      error: "Message cannot be empty.",
    };
  }

  if (trimmed.length > 2000) {
    return {
      success: false,
      error: "Message is too long (maximum 2000 characters).",
    };
  }

  try {
    // Authorize sender membership
    const membership = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      include: {
        conversation: {
          include: {
            members: {
              where: {
                userId: { not: userId },
              },
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!membership) {
      return {
        success: false,
        error: "You are not authorized to send messages in this conversation.",
      };
    }

    // Create message and touch conversation updatedAt
    const message = await prisma.$transaction(async (tx) => {
      const newMsg = await tx.message.create({
        data: {
          conversationId,
          senderId: userId,
          content: trimmed,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
        },
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      // Notify other members
      const recipientIds = membership.conversation.members.map((m) => m.userId);
      if (recipientIds.length > 0) {
        await tx.notification.createMany({
          data: recipientIds.map((recId) => ({
            userId: recId,
            type: "MESSAGE",
            title: `Message from ${session.user?.name || "Developer"}`,
            message: trimmed.length > 80 ? `${trimmed.slice(0, 77)}...` : trimmed,
          })),
        });
      }

      return newMsg;
    });

    revalidatePath("/chat");

    return {
      success: true,
      message: {
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
        updatedAt: message.updatedAt.toISOString(),
        sender: message.sender,
      },
    };
  } catch (error) {
    console.error("[sendMessage] Error:", error);
    return {
      success: false,
      error: "Failed to send message.",
    };
  }
}

/**
 * Start or open a direct 1-on-1 conversation with another real user.
 */
export async function startDirectConversation(targetUserId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be signed in.",
    };
  }

  const userId = session.user.id;

  if (targetUserId === userId) {
    return {
      success: false,
      error: "You cannot start a conversation with yourself.",
    };
  }

  try {
    // Validate target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!targetUser) {
      return {
        success: false,
        error: "Target user not found.",
      };
    }

    // Check if direct conversation already exists between these 2 users
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        type: "DIRECT",
        AND: [
          { members: { some: { userId } } },
          { members: { some: { userId: targetUserId } } },
        ],
      },
      select: {
        id: true,
      },
    });

    if (existingConversation) {
      return {
        success: true,
        conversationId: existingConversation.id,
        isNew: false,
      };
    }

    // Create new direct conversation with both members
    const newConversation = await prisma.$transaction(async (tx) => {
      const conv = await tx.conversation.create({
        data: {
          type: "DIRECT",
          members: {
            create: [
              { userId },
              { userId: targetUserId },
            ],
          },
        },
        select: {
          id: true,
        },
      });

      return conv;
    });

    revalidatePath("/chat");

    return {
      success: true,
      conversationId: newConversation.id,
      isNew: true,
    };
  } catch (error) {
    console.error("[startDirectConversation] Error:", error);
    return {
      success: false,
      error: "Failed to start conversation.",
    };
  }
}

/**
 * Search real eligible DevForge users to start a conversation with.
 */
export async function searchEligibleUsers(query: string = "") {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "Unauthorized.",
      users: [],
    };
  }

  const userId = session.user.id;
  const trimmed = query.trim();

  try {
    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
        ...(trimmed
          ? {
              OR: [
                { name: { contains: trimmed, mode: "insensitive" } },
                { username: { contains: trimmed, mode: "insensitive" } },
                { email: { contains: trimmed, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        profile: {
          select: {
            bio: true,
            location: true,
            availability: true,
            roles: {
              include: {
                role: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
      take: 20,
    });

    return {
      success: true,
      users,
    };
  } catch (error) {
    console.error("[searchEligibleUsers] Error:", error);
    return {
      success: false,
      error: "Failed to search users.",
      users: [],
    };
  }
}

/**
 * Fetch full developer profile for in-chat profile preview modal.
 */
export async function getDeveloperProfile(targetUserId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "Unauthorized.",
      profile: null,
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        profile: {
          select: {
            bio: true,
            location: true,
            website: true,
            githubUrl: true,
            linkedinUrl: true,
            availability: true,
            workMode: true,
            collaborationPreference: true,
            preferredProjectSize: true,
            roles: {
              include: {
                role: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                  },
                },
              },
            },
            lookingFor: {
              include: {
                lookingFor: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            interests: {
              include: {
                interest: {
                  select: {
                    id: true,
                    name: true,
                    category: true,
                  },
                },
              },
            },
          },
        },
        userSkills: {
          select: {
            level: numberLevel(true),
            yearsOfExperience: true,
            skill: {
              select: {
                name: true,
                category: true,
              },
            },
          },
          orderBy: {
            level: "desc",
          },
        },
      },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found.",
        profile: null,
      };
    }

    return {
      success: true,
      profile: user,
    };
  } catch (error) {
    console.error("[getDeveloperProfile] Error:", error);
    return {
      success: false,
      error: "Failed to load developer profile.",
      profile: null,
    };
  }
}

// Helper to satisfy prisma select type without hardcoding
function numberLevel(_flag: boolean) {
  return true;
}
