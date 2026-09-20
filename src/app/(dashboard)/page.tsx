import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { MyProjects, DashboardProject } from "@/components/dashboard/my-projects";
import { MyTeams, DashboardTeam } from "@/components/dashboard/my-teams";
import { RecentActivity, DashboardActivityItem } from "@/components/dashboard/recent-activity";
import { QuickActions } from "@/components/dashboard/quick-actions";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Execute all real data queries in parallel
  const [
    user,
    projectsCount,
    activeProjectsCount,
    repositoriesCount,
    activityCount,
    projectMemberships,
    projectOwners,
    teamMemberships,
    teamOwners,
    rawProjects,
    rawTeams,
    rawActivities,
    availableSkills,
  ] = await Promise.all([
    // Current user details
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        username: true,
        image: true,
      },
    }),

    // Total projects count (owned or member)
    prisma.project.count({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
    }),

    // Active projects count
    prisma.project.count({
      where: {
        status: "ACTIVE",
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
    }),

    // Repositories connected to user or user's projects
    prisma.repository.count({
      where: {
        OR: [
          { userId },
          {
            project: {
              OR: [
                { ownerId: userId },
                { members: { some: { userId } } },
              ],
            },
          },
        ],
      },
    }),

    // Recent activity count
    prisma.projectActivity.count({
      where: {
        OR: [
          { userId },
          {
            project: {
              OR: [
                { ownerId: userId },
                { members: { some: { userId } } },
              ],
            },
          },
        ],
      },
    }),

    // Collaborators from projects: members where user is owner or fellow member
    prisma.projectMember.findMany({
      where: {
        project: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } },
          ],
        },
        userId: { not: userId },
      },
      select: { userId: true },
    }),

    // Owners of projects user is a member of
    prisma.project.findMany({
      where: {
        members: { some: { userId } },
        ownerId: { not: userId },
      },
      select: { ownerId: true },
    }),

    // Collaborators from teams: members where user is owner or fellow member
    prisma.teamMember.findMany({
      where: {
        team: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } },
          ],
        },
        userId: { not: userId },
      },
      select: { userId: true },
    }),

    // Owners of teams user is a member of
    prisma.team.findMany({
      where: {
        members: { some: { userId } },
        ownerId: { not: userId },
      },
      select: { ownerId: true },
    }),

    // User's recent projects
    prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        status: true,
        visibility: true,
        category: true,
        language: true,
        updatedAt: true,
        members: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 4,
    }),

    // User's recent teams
    prisma.team.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      select: {
        id: true,
        name: true,
        description: true,
        ownerId: true,
        updatedAt: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 4,
    }),

    // Real recent activity records
    prisma.projectActivity.findMany({
      where: {
        OR: [
          { userId },
          {
            project: {
              OR: [
                { ownerId: userId },
                { members: { some: { userId } } },
              ],
            },
          },
        ],
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
        project: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 6,
    }),

    // Available skills for the Create Project dialog
    prisma.skill.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        category: true,
      },
    }),
  ]);

  // Compute unique collaborator count
  const collaboratorIds = new Set<string>();
  projectMemberships.forEach((m) => collaboratorIds.add(m.userId));
  projectOwners.forEach((p) => collaboratorIds.add(p.ownerId));
  teamMemberships.forEach((m) => collaboratorIds.add(m.userId));
  teamOwners.forEach((t) => collaboratorIds.add(t.ownerId));
  const collaboratorsCount = collaboratorIds.size;

  // Format projects
  const projects: DashboardProject[] = rawProjects.map((project) => ({
    id: project.id,
    name: project.name,
    slug: project.slug,
    description: project.description,
    status: project.status,
    visibility: project.visibility,
    category: project.category,
    language: project.language,
    memberCount: project.members.length,
    updatedAt: project.updatedAt,
  }));

  // Format teams
  const teams: DashboardTeam[] = rawTeams.map((team) => ({
    id: team.id,
    name: team.name,
    description: team.description,
    memberCount: team._count.members,
    isOwner: team.ownerId === userId,
    updatedAt: team.updatedAt,
  }));

  // Format recent activity
  const activities: DashboardActivityItem[] = rawActivities.map((act) => ({
    id: act.id,
    action: act.action,
    createdAt: act.createdAt,
    projectName: act.project?.name || null,
    projectSlug: act.project?.slug || null,
    userName: act.user?.name || null,
    userImage: act.user?.image || null,
  }));

  const displayName = user?.name || session.user.name || "Developer";

  return (
    <main className="min-h-screen">
      <div className="max-w-8xl mx-auto p-6 lg:p-8 space-y-8">
        {/* Top Greeting Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Welcome back, {displayName}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Here&apos;s what&apos;s happening across your development workspace.
            </p>
          </div>
        </div>

        {/* Real Statistics Row */}
        <DashboardStats
          projectsCount={projectsCount}
          activeProjectsCount={activeProjectsCount}
          collaboratorsCount={collaboratorsCount}
          repositoriesCount={repositoriesCount}
          activityCount={activityCount}
        />

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Projects & Teams */}
          <div className="lg:col-span-8 space-y-6">
            <MyProjects
              projects={projects}
              availableSkills={availableSkills}
            />

            <MyTeams teams={teams} />
          </div>

          {/* Right Column: Quick Actions & Recent Activity */}
          <div className="lg:col-span-4 space-y-6">
            <QuickActions availableSkills={availableSkills} />

            <RecentActivity activities={activities} />
          </div>
        </div>
      </div>
    </main>
  );
}