import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getProjectTestingData } from "./testing-actions";
import { TestingPage } from "@/components/testing/testing-page";
import { FlaskConical, Plus } from "lucide-react";

export const metadata = {
  title: "Testing | DevForge",
  description:
    "Automated test execution, test suite discovery, and run analytics for DevForge workspaces.",
};

type Props = {
  searchParams?: Promise<{ project?: string }>;
};

export default async function Page({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const sParams = searchParams ? await searchParams : {};

  // Find all projects the user is an owner or member of
  const userProjects = await prisma.project.findMany({
    where: {
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  // Empty state if user has no projects
  if (userProjects.length === 0) {
    return (
      <main className="min-h-full p-6 lg:p-8">
        <div className="mx-auto max-w-3xl py-16 text-center rounded-xl border border-dashed bg-card/40">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FlaskConical className="size-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold tracking-tight">
            No projects yet
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            You need at least one project to inspect test suites and run tests.
            Create a project to start building and testing with your team.
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

  // Determine selected project (or default to recent)
  const selectedSlug = sParams.project || userProjects[0].slug;
  const testingRes = await getProjectTestingData(selectedSlug);

  if (!testingRes.success || !testingRes.data) {
    // If specific slug is invalid or access denied, fallback to user's first project
    if (sParams.project && sParams.project !== userProjects[0].slug) {
      redirect(`/testing?project=${userProjects[0].slug}`);
    }
    redirect("/projects");
  }

  return (
    <TestingPage
      initialData={testingRes.data}
      userProjects={userProjects}
    />
  );
}
