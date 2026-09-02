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

  const developers = await prisma.user.findMany({
    where: {
      id: {
        not: session.user.id,
      },
      profile: {
        isNot: null,
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

      userSkills: {
        include: {
          skill: true,
        },

        orderBy: {
          level: "desc",
        },

        take: 5,
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

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
      <div className="px-3 py-3 lg:px-4">
        <div className="mx-auto max-w-1xl">
          <div className="mb-6 flex items-end justify-between gap-4">
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
              <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
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
            />
          )}
        </div>
      </div>
    </main>
  );
}