import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import {
  Users,
  KanbanSquare,
  Code2,
  Terminal,
  Rocket,
  Sparkles,
} from "lucide-react";

const features = [
  {
    title: "Developer discovery",
    description: "Find developers by skills and interests.",
    icon: Users,
  },
  {
    title: "Team collaboration",
    description: "Build teams and work together in real time.",
    icon: Users,
  },
  {
    title: "Kanban project management",
    description: "Plan, track, and manage project work.",
    icon: KanbanSquare,
  },
  {
    title: "Cloud development workspace",
    description: "A complete browser-based development environment.",
    icon: Code2,
  },
  {
    title: "Terminal & live preview",
    description:
      "Run commands and preview your applications instantly.",
    icon: Terminal,
  },
  {
    title: "Git & deployment",
    description:
      "Move your project from code to deployment.",
    icon: Rocket,
  },
];

function DevForgeLogo() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] shadow-lg shadow-violet-950/20">
      <div className="relative flex h-5 w-5 items-center justify-center">
        <div className="absolute h-4 w-4 rotate-45 rounded-[4px] border-2 border-white" />
        <div className="absolute h-2 w-2 rotate-45 rounded-[2px] bg-white" />
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M21.35 12.23c0-.72-.06-1.42-.18-2.09H12v3.95h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.91-4.21 2.91-7.25Z"
      />

      <path
        fill="#34A853"
        d="M12 21.5c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.5Z"
      />

      <path
        fill="#FBBC05"
        d="M6.54 13.58A5.85 5.85 0 0 1 6.23 12c0-.55.1-1.09.31-1.58V7.89H3.3A9.5 9.5 0 0 0 2.25 12c0 1.53.37 2.98 1.05 4.11l3.24-2.53Z"
      />

      <path
        fill="#EA4335"
        d="M12 6.39c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.83 3.48 14.63 2.5 12 2.5a9.74 9.74 0 0 0-8.7 5.39l3.24 2.53C7.31 8.11 9.46 6.39 12 6.39Z"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55v-2.12c-3.2.7-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.34.95.1-.74.4-1.24.73-1.53-2.55-.29-5.23-1.28-5.23-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18A10.9 10.9 0 0 1 12 6.11c.97 0 1.94.13 2.85.38 2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.75.11 3.04.74.8 1.18 1.83 1.18 3.08 0 4.41-2.69 5.38-5.25 5.67.41.35.78 1.03.78 2.08v3.08c0 .3.21.65.79.54A11.52 11.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <main
      className="h-screen overflow-hidden bg-zinc-950 text-white"
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif',
      }}
    >

      <style>{`
        .devforge-scroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .devforge-scroll::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }

        .devforge-scroll::-webkit-scrollbar-track {
          display: none;
        }

        .devforge-scroll::-webkit-scrollbar-thumb {
          display: none;
        }
      `}</style>

      <div className="grid h-screen lg:grid-cols-[minmax(0,1fr)_minmax(420px,520px)]">

        <section className="devforge-scroll relative hidden min-h-0 overflow-y-auto border-r border-white/10 lg:block">

          {/* Background glow */}
          <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[120px]" />

          <div className="pointer-events-none absolute -bottom-40 right-0 h-[450px] w-[450px] rounded-full bg-blue-600/10 blur-[120px]" />

          <div className="relative flex min-h-full w-full flex-col justify-between p-12 xl:p-16">

            <div className="flex items-center gap-3">
              <DevForgeLogo />

              <div>
                <div className="text-lg font-semibold tracking-tight">
                  DevForge
                </div>

                <div className="text-xs text-zinc-500">
                  Collaborative development
                </div>
              </div>
            </div>

            <div className="my-8 max-w-2xl">

              <Badge
                variant="secondary"
                className="cursor-pointer border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10 p-3"
              >
                <Sparkles className="mr-2 h-3.5 w-3.5" />

                Collaborative Developer Platform
              </Badge>

              <h1 className="mt-7 text-5xl font-semibold leading-[1.05] tracking-[-0.04em] text-white xl:text-7xl">
                Everything developers need.

                <span className="block text-zinc-500">
                  In one place.
                </span>
              </h1>

              <p className="mt-7 max-w-xl text-base leading-7 text-zinc-400 xl:text-lg">
                Discover developers, build teams, manage projects,
                collaborate on code, run terminals, preview
                applications, and take projects from idea to
                deployment.
              </p>

              <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">

                {features.map((feature) => {
                  const Icon = feature.icon;

                  return (
                    <div
                      key={feature.title}
                      className="group cursor-pointer rounded-xl border border-white/10 bg-white/[0.03] p-4 transition duration-200 hover:border-white/20 hover:bg-white/[0.06]"
                    >
                      <div className="flex items-start gap-3">

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-zinc-300 transition group-hover:bg-white/10 group-hover:text-white">
                          <Icon className="h-4 w-4" />
                        </div>

                        <div>
                          <p className="text-sm font-medium text-zinc-200">
                            {feature.title}
                          </p>

                          <p className="mt-1 text-xs leading-5 text-zinc-500">
                            {feature.description}
                          </p>
                        </div>

                      </div>
                    </div>
                  );
                })}

              </div>
            </div>

            <div className="flex items-center gap-2 pb-2 text-xs text-zinc-600">
              <span>DevForge</span>

              <span>•</span>

              <span>Build together. Ship together.</span>
            </div>

          </div>
        </section>


        <section className="relative flex h-screen min-h-0 items-center justify-center overflow-hidden bg-zinc-950 p-6 sm:p-10">

          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/[0.04] blur-[140px]" />

          <Card className="relative w-full max-w-md border-white/10 bg-zinc-900/70 shadow-2xl shadow-black/40 backdrop-blur-xl">

            <CardHeader className="space-y-5 text-center">

              <div className="mx-auto">
                <DevForgeLogo />
              </div>

              <div>
                <CardTitle className="text-2xl font-semibold tracking-tight text-white">
                  Welcome to DevForge
                </CardTitle>

                <CardDescription className="mt-2 text-zinc-500">
                  Sign in or create your account to start building.
                </CardDescription>
              </div>

            </CardHeader>

            <CardContent className="space-y-3">

              <form
                action={async () => {
                  "use server";

                  await signIn("google", {
                    redirectTo: "/",
                  });
                }}
              >
                <Button
                  type="submit"
                  variant="outline"
                  className="h-12 w-full cursor-pointer !border-white/10 !bg-white !text-black transition hover:!bg-zinc-200"
                >
                  <GoogleIcon />

                  <span className="ml-2">
                    Continue with Google
                  </span>
                </Button>
              </form>

              <form
                action={async () => {
                  "use server";

                  await signIn("github", {
                    redirectTo: "/",
                  });
                }}
              >
                <Button
                  type="submit"
                  variant="outline"
                  className="h-12 w-full cursor-pointer border-white/10 bg-zinc-800 text-white transition hover:bg-zinc-700"
                >
                  <GitHubIcon />

                  <span className="ml-2">
                    Continue with GitHub
                  </span>
                </Button>
              </form>

              <div className="flex items-center gap-3 py-4">
                <Separator className="bg-white/10" />

                <span className="whitespace-nowrap text-[11px] uppercase tracking-wider text-zinc-600">
                  Secure OAuth
                </span>

                <Separator className="bg-white/10" />
              </div>

              <p className="px-4 text-center text-xs leading-5 text-zinc-600">
                By continuing, you agree to use DevForge responsibly
                and collaborate respectfully with other developers.
              </p>

            </CardContent>
          </Card>

        </section>
      </div>
    </main>
  );
}