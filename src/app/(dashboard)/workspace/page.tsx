import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function WorkspaceRedirectPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Find user's most recently active project (as owner or member)
  const recentProject = await prisma.project.findFirst({
    where: {
      OR: [
        { ownerId: userId },
        {
          members: {
            some: { userId },
          },
        },
      ],
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      slug: true,
    },
  });

  if (recentProject) {
    redirect(`/projects/${recentProject.slug}`);
  }

  // Fallback: If no projects created yet, redirect to Projects page
  redirect("/projects");
}
