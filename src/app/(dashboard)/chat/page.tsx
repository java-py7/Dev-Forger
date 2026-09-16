import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ChatLayout } from "@/components/chat/chat-layout";
import {
  getConversations,
  getConversationMessages,
} from "./actions";
import { ChatConversation, ChatMessage } from "@/components/chat/types";

type Props = {
  searchParams?: Promise<{ id?: string }>;
};

export const metadata = {
  title: "Chat | DevForge",
  description: "Direct messaging and project collaboration channels for developers.",
};

export default async function ChatPage({ searchParams }: Props) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Ensure profile is setup
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!profile) {
    redirect("/profile/setup");
  }

  const sParams = searchParams ? await searchParams : {};
  const requestedId = sParams.id || null;

  // Fetch initial conversations
  const convsResult = await getConversations();
  const conversations = (convsResult.conversations || []) as unknown as ChatConversation[];

  // Determine active conversation
  let activeId: string | null = null;
  if (requestedId && conversations.some((c) => c.id === requestedId)) {
    activeId = requestedId;
  } else if (conversations.length > 0) {
    // Default to the first (most recently active) conversation
    activeId = conversations[0].id;
  }

  // Fetch initial messages for active conversation if present
  let initialMessages: ChatMessage[] = [];
  let initialHasMore = false;

  if (activeId) {
    const msgsResult = await getConversationMessages(activeId, 50);
    if (msgsResult.success && msgsResult.messages) {
      initialMessages = msgsResult.messages;
      initialHasMore = msgsResult.hasMore;
    }
  }

  return (
    <ChatLayout
      currentUserId={userId}
      initialConversations={conversations}
      initialActiveConversationId={activeId}
      initialMessages={initialMessages}
      initialHasMore={initialHasMore}
    />
  );
}
