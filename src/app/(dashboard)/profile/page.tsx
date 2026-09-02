import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { ProfileSkills } from "@/components/profile/profile-skills";
import { WorkPreferences } from "@/components/profile/work-preferences";
import { Interests } from "@/components/profile/interests";
import { DeveloperStats } from "@/components/profile/developer-stats";
import { ProfileVisibility } from "@/components/profile/profile-visibility";
import { DeveloperPreferences } from "@/components/profile/developer-preferences";

import {
  MapPin,
  Globe,
  ExternalLink,
  UserRound,
  Code2,
} from "lucide-react";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [user, skills, roles, lookingFor, interests] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        profile: {
          include: {
            roles: true,
            lookingFor: true,
            interests: true,
          },
        },
        userSkills: {
          include: {
            skill: true,
          },
          orderBy: {
            skill: {
              name: "asc",
            },
          },
        },
      },
    }),

    prisma.skill.findMany({
      orderBy: {
        name: "asc",
      },
    }),

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
  ]);

  if (!user) {
    redirect("/login");
  }

  const [projectsCompleted, teamsJoined, contributions] =
    await Promise.all([
      prisma.project.count({
        where: {
          status: "COMPLETED",
          OR: [
            {
              ownerId: userId,
            },
            {
              members: {
                some: {
                  userId,
                },
              },
            },
          ],
        },
      }),

      prisma.teamMember.count({
        where: {
          userId,
        },
      }),

      prisma.projectActivity.count({
        where: {
          userId,
        },
      }),
    ]);

  async function saveProfile(formData: FormData) {
    "use server";

    const currentSession = await auth();

    const currentUserId = currentSession?.user?.id;
    const currentUserName = currentSession?.user?.name ?? null;

    if (!currentUserId) {
      redirect("/login");
    }

    const name = String(formData.get("name") ?? "").trim();
    const username = String(formData.get("username") ?? "").trim();
    const bio = String(formData.get("bio") ?? "").trim();
    const location = String(formData.get("location") ?? "").trim();
    const website = String(formData.get("website") ?? "").trim();
    const githubUrl = String(formData.get("githubUrl") ?? "").trim();
    const linkedinUrl = String(formData.get("linkedinUrl") ?? "").trim();

    const preferredRoleIds = formData
      .getAll("preferredRole")
      .map(String);

    const lookingForIds = formData
      .getAll("lookingFor")
      .map(String);

    const availabilityValue = String(
      formData.get("availability") ?? "AVAILABLE"
    );

    const availability =
      availabilityValue === "BUSY" ||
      availabilityValue === "NOT_AVAILABLE"
        ? availabilityValue
        : "AVAILABLE";

    const collaborationPreferenceValue = String(
      formData.get("collaborationPreference") ?? ""
    );

    const collaborationPreference =
      collaborationPreferenceValue === "TEAM" ||
      collaborationPreferenceValue === "BOTH"
        ? collaborationPreferenceValue
        : collaborationPreferenceValue === "INDIVIDUAL"
          ? "INDIVIDUAL"
          : null;

    const preferredProjectSizeValue = String(
      formData.get("preferredProjectSize") ?? ""
    );

    const preferredProjectSize =
      preferredProjectSizeValue === "MEDIUM" ||
      preferredProjectSizeValue === "LARGE" ||
      preferredProjectSizeValue === "ANY"
        ? preferredProjectSizeValue
        : preferredProjectSizeValue === "SMALL"
          ? "SMALL"
          : null;

    const profileVisibilityValue = String(
      formData.get("profileVisibility") ?? "PUBLIC"
    );

    const profileVisibility =
      profileVisibilityValue === "PRIVATE"
        ? "PRIVATE"
        : "PUBLIC";

    const selectedInterestIds = [
      ...new Set(formData.getAll("interestIds").map(String)),
    ];

    const selectedSkillIds = formData
      .getAll("skillIds")
      .map(String);

    const uniqueSkillIds = [...new Set(selectedSkillIds)];

    const validSkills = await prisma.skill.findMany({
      where: {
        id: {
          in: uniqueSkillIds,
        },
      },
      select: {
        id: true,
      },
    });

    const validSkillIds = new Set(
      validSkills.map((skill) => skill.id)
    );

    const selectedSkills = uniqueSkillIds
      .filter((skillId) => validSkillIds.has(skillId))
      .map((skillId) => {
        const rawLevel = Number(
          formData.get(`skillLevel-${skillId}`) ?? 2
        );

        const rawExperience = Number(
          formData.get(`skillExperience-${skillId}`) ?? 0
        );

        const level = Math.min(
          5,
          Math.max(
            1,
            Number.isFinite(rawLevel) ? rawLevel : 2
          )
        );

        const yearsOfExperience = Math.min(
          10,
          Math.max(
            0,
            Number.isFinite(rawExperience)
              ? rawExperience
              : 0
          )
        );

        return {
          skillId,
          level,
          yearsOfExperience,
        };
      });

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: {
          id: currentUserId,
        },
        data: {
          name: name || currentUserName,
          username: username || null,
        },
      });

      const profile = await tx.profile.upsert({
        where: {
          userId: currentUserId,
        },

        create: {
          userId: currentUserId,
          bio: bio || null,
          location: location || null,
          website: website || null,
          githubUrl: githubUrl || null,
          linkedinUrl: linkedinUrl || null,
          availability,
          collaborationPreference,
          preferredProjectSize,
          visibility: profileVisibility,
        },

        update: {
          bio: bio || null,
          location: location || null,
          website: website || null,
          githubUrl: githubUrl || null,
          linkedinUrl: linkedinUrl || null,
          availability,
          collaborationPreference,
          preferredProjectSize,
          visibility: profileVisibility,
        },
      });

      const validRoleIds = await tx.developerRole.findMany({
        where: {
          id: {
            in: preferredRoleIds,
          },
        },
        select: {
          id: true,
        },
      });

      const validLookingForIds = await tx.lookingFor.findMany({
        where: {
          id: {
            in: lookingForIds,
          },
        },
        select: {
          id: true,
        },
      });

      await tx.userDeveloperRole.deleteMany({
        where: {
          profileId: profile.id,
        },
      });

      if (validRoleIds.length > 0) {
        await tx.userDeveloperRole.createMany({
          data: validRoleIds.map((role) => ({
            profileId: profile.id,
            roleId: role.id,
          })),
        });
      }

      await tx.userLookingFor.deleteMany({
        where: {
          profileId: profile.id,
        },
      });

      if (validLookingForIds.length > 0) {
        await tx.userLookingFor.createMany({
          data: validLookingForIds.map((item) => ({
            profileId: profile.id,
            lookingForId: item.id,
          })),
        });
      }

      const validInterestIds = await tx.interest.findMany({
        where: {
          id: {
            in: selectedInterestIds,
          },
        },
        select: {
          id: true,
        },
      });

      await tx.userInterest.deleteMany({
        where: {
          profileId: profile.id,
        },
      });

      if (validInterestIds.length > 0) {
        await tx.userInterest.createMany({
          data: validInterestIds.map((interest) => ({
            profileId: profile.id,
            interestId: interest.id,
          })),
        });
      }

      await tx.userSkill.deleteMany({
        where: {
          userId: currentUserId,
        },
      });

      if (selectedSkills.length > 0) {
        await tx.userSkill.createMany({
          data: selectedSkills.map((skill) => ({
            userId: currentUserId,
            skillId: skill.skillId,
            level: skill.level,
            yearsOfExperience: skill.yearsOfExperience,
          })),
        });
      }
    });

    redirect("/profile");
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-5xl px-6 py-10 lg:px-8">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-foreground text-background">
              <Code2 className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                Your profile
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Manage your developer profile and collaboration preferences.
              </p>
            </div>
          </div>
        </div>

        <form action={saveProfile} className="space-y-6">

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic information</CardTitle>

              <CardDescription>
                Update the information other developers see on your profile.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">

                <div className="space-y-2">
                  <label
                    htmlFor="name"
                    className="text-sm font-medium"
                  >
                    Full name
                  </label>

                  <Input
                    id="name"
                    name="name"
                    defaultValue={user.name ?? ""}
                    placeholder="Your name"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="username"
                    className="text-sm font-medium"
                  >
                    Username
                  </label>

                  <Input
                    id="username"
                    name="username"
                    defaultValue={user.username ?? ""}
                    placeholder="yourusername"
                  />

                  <p className="text-xs text-muted-foreground">
                    Your public DevForge username.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">

                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium"
                  >
                    Email
                  </label>

                  <Input
                    id="email"
                    value={user.email ?? ""}
                    disabled
                    readOnly
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="role"
                    className="text-sm font-medium"
                  >
                    Developer role
                  </label>

                  <Input
                    id="role"
                    value={user.role}
                    disabled
                    readOnly
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="bio"
                  className="text-sm font-medium"
                >
                  Bio
                </label>

                <textarea
                  id="bio"
                  name="bio"
                  defaultValue={user.profile?.bio ?? ""}
                  placeholder="Tell other developers a little about yourself..."
                  className="min-h-32 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                />

                <p className="text-xs text-muted-foreground">
                  Keep it focused on your development interests,
                  experience, and goals.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Developer Details */}
          <Card>
            <CardHeader>
              <CardTitle>Developer details</CardTitle>

              <CardDescription>
                Add information that helps other developers connect with you.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">

              <div className="grid gap-5 md:grid-cols-2">

                <div className="space-y-2">
                  <label
                    htmlFor="location"
                    className="flex items-center gap-2 text-sm font-medium"
                  >
                    <MapPin className="h-4 w-4" />
                    Location
                  </label>

                  <Input
                    id="location"
                    name="location"
                    defaultValue={user.profile?.location ?? ""}
                    placeholder="Mumbai, India"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="website"
                    className="flex items-center gap-2 text-sm font-medium"
                  >
                    <Globe className="h-4 w-4" />
                    Portfolio
                  </label>

                  <Input
                    id="website"
                    name="website"
                    type="url"
                    defaultValue={user.profile?.website ?? ""}
                    placeholder="https://yourPortfolio.com"
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">

                <div className="space-y-2">
                  <label
                    htmlFor="githubUrl"
                    className="flex items-center gap-2 text-sm font-medium"
                  >
                    <ExternalLink className="h-4 w-4" />
                    GitHub
                  </label>

                  <Input
                    id="githubUrl"
                    name="githubUrl"
                    type="url"
                    defaultValue={user.profile?.githubUrl ?? ""}
                    placeholder="https://github.com/username"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="linkedinUrl"
                    className="flex items-center gap-2 text-sm font-medium"
                  >
                    <ExternalLink className="h-4 w-4" />
                    LinkedIn
                  </label>

                  <Input
                    id="linkedinUrl"
                    name="linkedinUrl"
                    type="url"
                    defaultValue={user.profile?.linkedinUrl ?? ""}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>

              <CardDescription>
                Update the technologies you know, your experience,
                and your current level.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {skills.length === 0 ? (
                <div className="rounded-xl border border-dashed p-8 text-center">
                  <Code2 className="mx-auto h-8 w-8 text-muted-foreground" />

                  <p className="mt-3 font-medium">
                    No skills available
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    No skills have been added to DevForge yet.
                  </p>
                </div>
              ) : (
                <ProfileSkills
                  skills={skills}
                  userSkills={user.userSkills}
                />
              )}
            </CardContent>
          </Card>

          {/* Developer Preferences */}
          <DeveloperPreferences
            roles={roles}
            lookingFor={lookingFor}
            selectedRoles={user.profile?.roles ?? []}
            selectedLookingFor={user.profile?.lookingFor ?? []}
            availability={
              user.profile?.availability ?? "AVAILABLE"
            }
          />

          {/* Work Preferences */}
          <WorkPreferences
            collaborationPreference={
              user.profile?.collaborationPreference ?? null
            }
            preferredProjectSize={
              user.profile?.preferredProjectSize ?? null
            }
          />

          {/* Interests */}
          <Interests
            interests={interests}
            selectedInterests={user.profile?.interests ?? []}
          />

          {/* Developer Stats */}
          <DeveloperStats
            projectsCompleted={projectsCompleted}
            teamsJoined={teamsJoined}
            contributions={contributions}
            skills={user.userSkills.length}
          />

          {/* Visibility */}
          <ProfileVisibility
            visibility={user.profile?.visibility ?? "PUBLIC"}
          />

          {/* Save */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserRound className="h-4 w-4" />
              Your profile changes are saved to your DevForge account.
            </div>

            <Button
              type="submit"
              size="lg"
              className="cursor-pointer"
            >
              Save changes
            </Button>

          </div>
        </form>
      </div>
    </main>
  );
}