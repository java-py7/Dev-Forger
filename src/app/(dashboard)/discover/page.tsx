import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

import { Compass, Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { DeveloperDiscover } from "@/components/discover/developer-discover";

export default async function DiscoverPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [
    developers,
    roles,
    lookingFor,
    interests,
    skills,
  ] = await Promise.all([
    prisma.user.findMany({
      where: {
        id: {
          not: userId,
        },
        profile: {
          is: {
            visibility: "PUBLIC",
          },
        },
      },

      include: {
        profile: {
          include: {
            roles: {
              include: {
                role: true,
              },
            },

            lookingFor: {
              include: {
                lookingFor: true,
              },
            },

            interests: {
              include: {
                interest: true,
              },
            },
          },
        },

        // Get ALL skills because the profile modal
        // needs complete skill + experience information.
        userSkills: {
          include: {
            skill: true,
          },

          orderBy: {
            level: "desc",
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    }),

    // ALL filter options come directly from the database.
    prisma.developerRole.findMany({
      orderBy: {
        name: "asc",
      },
    }),

    prisma.lookingFor.findMany({
      orderBy: {
        name: "asc",
      },
    }),

    prisma.interest.findMany({
      orderBy: {
        name: "asc",
      },
    }),

    prisma.skill.findMany({
      orderBy: {
        name: "asc",
      },
    }),
  ]);

 const developersWithProfiles = developers.filter(
  (
    developer
  ): developer is typeof developer & {
    profile: NonNullable<typeof developer.profile>;
  } => developer.profile !== null
);

  return (
    <main className="min-h-full">
    
      {/* Content */}
      <div className="px-6 py-6 lg:px-8">
        <div className="mx-auto max-w-8xl">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">
                Developers
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Find developers to collaborate with on DevForge.
              </p>
            </div>

            <Badge variant="secondary">
              <Users className="mr-1.5 size-3.5" />
              Developer network
            </Badge>
          </div>

          {developersWithProfiles.length === 0 ? (
            <Card>
              <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
                <div className="flex size-12 items-center justify-center rounded-xl border bg-muted/40">
                  <Users className="size-5 text-muted-foreground" />
                </div>

                <h3 className="mt-4 font-semibold">
                  No developers yet
                </h3>

                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Other developers will appear here after they
                  create their DevForge profiles.
                </p>
              </CardContent>
            </Card>
          ) : (
            <DeveloperDiscover
              developers={developersWithProfiles}
              roles={roles}
              lookingFor={lookingFor}
              interests={interests}
              skills={skills}
            />
          )}
        </div>
      </div>
    </main>
  );
}