"use server";

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  ensureWorkspaceDiskSync,
  getProjectWorkspaceDirById,
} from "@/server/workspace-manager";

// ============================================================
// TYPES
// ============================================================

export type TestSuiteItem = {
  id: string;
  name: string;
  path: string;
  size: number;
  updatedAt: string;
  testsCount: number;
  lastStatus: "PASSED" | "FAILED" | "PENDING" | "UNRUN";
};

export type TestRunItem = {
  id: string;
  projectId: string;
  status: "PASSED" | "FAILED" | "ERROR" | "CANCELLED";
  durationMs: number;
  totalSuites: number;
  totalTests: number;
  passedCount: number;
  failedCount: number;
  pendingCount: number;
  output: string;
  trigger: string;
  command: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    username: string | null;
  };
};

export type TestingOverviewStats = {
  totalSuites: number;
  totalTests: number;
  passingTests: number;
  failingTests: number;
  pendingTests: number;
  lastRunAt: string | null;
  overallStatus: "NOT_CONFIGURED" | "IDLE" | "PASSED" | "FAILED" | "RUNNING";
};

export type ProjectTestingData = {
  project: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    visibility: string;
    ownerId: string;
  };
  isConfigured: boolean;
  framework: string | null;
  testScript: string | null;
  suites: TestSuiteItem[];
  runs: TestRunItem[];
  stats: TestingOverviewStats;
  canEdit: boolean;
  isOwner: boolean;
};

type RunTestResponse = {
  success: boolean;
  error?: string;
  notConfigured?: boolean;
  run?: TestRunItem;
};

// ============================================================
// HELPERS
// ============================================================

const TEST_FILE_REGEX = /\.(test|spec)\.(ts|tsx|js|jsx|mjs|cjs)$/i;
const IGNORED_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "dist",
  "build",
  "coverage",
  ".cache",
]);

function scanDirectoryForTestFiles(dir: string, baseDir: string): TestSuiteItem[] {
  const suites: TestSuiteItem[] = [];

  if (!fs.existsSync(/*turbopackIgnore: true*/ dir)) return suites;

  try {
    const entries = fs.readdirSync(/*turbopackIgnore: true*/ dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) continue;
        const subPath = path.join(dir, entry.name);
        suites.push(...scanDirectoryForTestFiles(subPath, baseDir));
      } else if (entry.isFile()) {
        const isTestFile =
          TEST_FILE_REGEX.test(entry.name) ||
          (dir.includes("__tests__") && /\.(ts|tsx|js|jsx|mjs|cjs)$/i.test(entry.name));

        if (isTestFile) {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path
            .relative(baseDir, fullPath)
            .replace(/\\/g, "/");

          let size = 0;
          let mtime = new Date();
          let testsCount = 0;

          try {
            const stats = fs.statSync(/*turbopackIgnore: true*/ fullPath);
            size = stats.size;
            mtime = stats.mtime;

            const content = fs.readFileSync(/*turbopackIgnore: true*/ fullPath, "utf8");
            const testMatches = content.match(/\b(test|it)\s*\(/g);
            testsCount = testMatches ? testMatches.length : 1;
          } catch {
            // Ignore individual file stat/read errors
          }

          suites.push({
            id: relativePath,
            name: entry.name,
            path: relativePath,
            size,
            updatedAt: mtime.toISOString(),
            testsCount,
            lastStatus: "UNRUN",
          });
        }
      }
    }
  } catch (err) {
    console.error("Error scanning test directory:", err);
  }

  return suites;
}

function detectTestConfiguration(dir: string): {
  isConfigured: boolean;
  framework: string | null;
  testScript: string | null;
} {
  const pkgPath = path.join(dir, "package.json");

  if (!fs.existsSync(/*turbopackIgnore: true*/ pkgPath)) {
    return {
      isConfigured: false,
      framework: null,
      testScript: null,
    };
  }

  try {
    const raw = fs.readFileSync(/*turbopackIgnore: true*/ pkgPath, "utf8");
    const pkg = JSON.parse(raw) as {
      scripts?: Record<string, string>;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    const scripts = pkg.scripts || {};
    const testScript = scripts.test || null;
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    let framework: string | null = null;
    if ("vitest" in allDeps) {
      framework = "Vitest";
    } else if ("jest" in allDeps || "@types/jest" in allDeps) {
      framework = "Jest";
    } else if ("playwright" in allDeps || "@playwright/test" in allDeps) {
      framework = "Playwright";
    } else if ("mocha" in allDeps) {
      framework = "Mocha";
    } else if (testScript && testScript.includes("node --test")) {
      framework = "Node.js Test Runner";
    }

    // Check if test script is genuinely configured (not npm init default error echo)
    const isDefaultUnset =
      !testScript ||
      testScript.includes("Error: no test specified") ||
      testScript.trim() === 'echo "Error: no test specified" && exit 1';

    const isConfigured = !isDefaultUnset || framework !== null;

    if (isConfigured && !framework) {
      framework = "npm test script";
    }

    return {
      isConfigured,
      framework,
      testScript,
    };
  } catch {
    return {
      isConfigured: false,
      framework: null,
      testScript: null,
    };
  }
}

function parseTestCounts(output: string): {
  passed: number;
  failed: number;
  pending: number;
  total: number;
} {
  let passed = 0;
  let failed = 0;
  let pending = 0;

  // Vitest / Jest patterns: "Tests  2 passed, 1 failed (3)"
  const passedMatch = output.match(/(\d+)\s+passed/i);
  if (passedMatch) passed = Number.parseInt(passedMatch[1], 10);

  const failedMatch = output.match(/(\d+)\s+failed/i);
  if (failedMatch) failed = Number.parseInt(failedMatch[1], 10);

  const pendingMatch = output.match(/(\d+)\s+(pending|skipped|todo)/i);
  if (pendingMatch) pending = Number.parseInt(pendingMatch[1], 10);

  // Node.js test runner: "# pass 4", "# fail 1"
  const nodePassMatch = output.match(/#\s*pass\s+(\d+)/i);
  if (nodePassMatch) passed = Number.parseInt(nodePassMatch[1], 10);

  const nodeFailMatch = output.match(/#\s*fail\s+(\d+)/i);
  if (nodeFailMatch) failed = Number.parseInt(nodeFailMatch[1], 10);

  const total = passed + failed + pending;
  return { passed, failed, pending, total };
}

// ============================================================
// GET PROJECT TESTING DATA
// ============================================================

export async function getProjectTestingData(
  slug: string
): Promise<{ success: boolean; data?: ProjectTestingData; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized. Please sign in." };
  }

  const userId = session.user.id;

  try {
    const project = await prisma.project.findUnique({
      where: { slug },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                username: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      return { success: false, error: "Project not found." };
    }

    const isOwner = project.ownerId === userId;
    const member = project.members.find((m) => m.userId === userId);
    const isMember = !!member;
    const isPublic = project.visibility === "PUBLIC";

    if (!isOwner && !isMember && !isPublic) {
      return { success: false, error: "Access denied to project testing workspace." };
    }

    const canEdit = isOwner || (isMember && member.role !== "VIEWER");

    // Ensure disk directory exists and sync from DB files if empty
    let workspaceDir: string;
    try {
      workspaceDir = await ensureWorkspaceDiskSync(project.id);
    } catch {
      const { dir } = await getProjectWorkspaceDirById(project.id);
      workspaceDir = dir;
    }

    // Inspect real workspace configuration & test suites
    const { isConfigured, framework, testScript } =
      detectTestConfiguration(workspaceDir);

    const suites = scanDirectoryForTestFiles(workspaceDir, workspaceDir);

    // Fetch real test runs from ProjectActivity
    const activities = await prisma.projectActivity.findMany({
      where: {
        projectId: project.id,
        action: "TEST_RUN",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            username: true,
          },
        },
      },
    });

    const runs: TestRunItem[] = activities.map((act) => {
      const meta = (act.metadata ?? {}) as Record<string, unknown>;
      return {
        id: act.id,
        projectId: act.projectId,
        status: (meta.status as TestRunItem["status"]) || "PASSED",
        durationMs: typeof meta.durationMs === "number" ? meta.durationMs : 0,
        totalSuites: typeof meta.totalSuites === "number" ? meta.totalSuites : suites.length,
        totalTests: typeof meta.totalTests === "number" ? meta.totalTests : 0,
        passedCount: typeof meta.passedCount === "number" ? meta.passedCount : 0,
        failedCount: typeof meta.failedCount === "number" ? meta.failedCount : 0,
        pendingCount: typeof meta.pendingCount === "number" ? meta.pendingCount : 0,
        output: typeof meta.output === "string" ? meta.output : "",
        trigger: typeof meta.trigger === "string" ? meta.trigger : "Manual",
        command: typeof meta.command === "string" ? meta.command : "npm test",
        createdAt: act.createdAt.toISOString(),
        user: act.user,
      };
    });

    // Compute overview stats
    const latestRun = runs[0] || null;
    let overallStatus: TestingOverviewStats["overallStatus"] = "IDLE";

    if (!isConfigured && suites.length === 0) {
      overallStatus = "NOT_CONFIGURED";
    } else if (latestRun) {
      overallStatus = latestRun.status === "PASSED" ? "PASSED" : "FAILED";
    }

    const stats: TestingOverviewStats = {
      totalSuites: suites.length,
      totalTests: latestRun ? latestRun.totalTests : suites.reduce((acc, s) => acc + s.testsCount, 0),
      passingTests: latestRun ? latestRun.passedCount : 0,
      failingTests: latestRun ? latestRun.failedCount : 0,
      pendingTests: latestRun ? latestRun.pendingCount : 0,
      lastRunAt: latestRun ? latestRun.createdAt : null,
      overallStatus,
    };

    return {
      success: true,
      data: {
        project: {
          id: project.id,
          name: project.name,
          slug: project.slug,
          description: project.description,
          visibility: project.visibility,
          ownerId: project.ownerId,
        },
        isConfigured,
        framework,
        testScript,
        suites,
        runs,
        stats,
        canEdit,
        isOwner,
      },
    };
  } catch (err) {
    console.error("Error in getProjectTestingData:", err);
    return { success: false, error: "Failed to load project testing workspace." };
  }
}

// ============================================================
// RUN PROJECT TESTS ACTION
// ============================================================

export async function runProjectTestsAction(
  projectId: string
): Promise<RunTestResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized. Please sign in." };
  }

  const userId = session.user.id;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!project) {
      return { success: false, error: "Project not found." };
    }

    const isOwner = project.ownerId === userId;
    const isMember = project.members.length > 0;
    const canEdit = isOwner || (isMember && project.members[0].role !== "VIEWER");

    if (!canEdit) {
      return { success: false, error: "You do not have permission to run tests for this project." };
    }

    const workspaceDir = await ensureWorkspaceDiskSync(projectId);
    const { isConfigured, testScript } = detectTestConfiguration(workspaceDir);
    const suites = scanDirectoryForTestFiles(workspaceDir, workspaceDir);

    if (!isConfigured && suites.length === 0) {
      return {
        success: false,
        notConfigured: true,
        error:
          "Testing is not configured for this project. Please add a test script to package.json or create test files.",
      };
    }

    // Determine execution command
    const command = testScript ? "npm test" : "node --test";
    const startTime = Date.now();

    // Execute tests in the project workspace directory
    const executionResult = await new Promise<{
      exitCode: number;
      stdout: string;
      stderr: string;
      timedOut: boolean;
    }>((resolve) => {
      let stdout = "";
      let stderr = "";
      let finished = false;

      const child = spawn(command, {
        cwd: workspaceDir,
        shell: true,
        env: {
          ...process.env,
          CI: "true",
          FORCE_COLOR: "0",
        },
      });

      child.stdout.on("data", (chunk: Buffer) => {
        stdout += chunk.toString("utf8");
      });

      child.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString("utf8");
      });

      // 30 seconds timeout safeguard
      const timer = setTimeout(() => {
        if (!finished) {
          finished = true;
          try {
            child.kill("SIGKILL");
          } catch {
            // Ignore kill error
          }
          resolve({
            exitCode: 124,
            stdout,
            stderr: stderr + "\n[DevForge Runner] Test execution timed out after 30 seconds.",
            timedOut: true,
          });
        }
      }, 30000);

      child.on("close", (code) => {
        if (!finished) {
          finished = true;
          clearTimeout(timer);
          resolve({
            exitCode: code ?? 1,
            stdout,
            stderr,
            timedOut: false,
          });
        }
      });

      child.on("error", (err) => {
        if (!finished) {
          finished = true;
          clearTimeout(timer);
          resolve({
            exitCode: 1,
            stdout,
            stderr: `${stderr}\nExecution failed: ${err.message}`,
            timedOut: false,
          });
        }
      });
    });

    const durationMs = Date.now() - startTime;
    const combinedOutput = (
      executionResult.stdout +
      (executionResult.stderr ? `\n--- Standard Error ---\n${executionResult.stderr}` : "")
    ).trim();

    const isPassed = executionResult.exitCode === 0;
    const counts = parseTestCounts(combinedOutput);

    const totalTests = counts.total > 0 ? counts.total : isPassed ? suites.length : 1;
    const passedCount = counts.passed > 0 ? counts.passed : isPassed ? totalTests : 0;
    const failedCount = counts.failed > 0 ? counts.failed : isPassed ? 0 : 1;
    const pendingCount = counts.pending;

    const status: TestRunItem["status"] = isPassed ? "PASSED" : "FAILED";

    // Record real test execution in ProjectActivity
    const activity = await prisma.projectActivity.create({
      data: {
        projectId: project.id,
        userId,
        action: "TEST_RUN",
        metadata: {
          status,
          durationMs,
          totalSuites: suites.length,
          totalTests,
          passedCount,
          failedCount,
          pendingCount,
          output: combinedOutput || (isPassed ? "Tests passed successfully." : "Test suite failed."),
          trigger: "Manual - Web Dashboard",
          command,
          exitCode: executionResult.exitCode,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            username: true,
          },
        },
      },
    });

    revalidatePath("/testing");

    const runItem: TestRunItem = {
      id: activity.id,
      projectId: project.id,
      status,
      durationMs,
      totalSuites: suites.length,
      totalTests,
      passedCount,
      failedCount,
      pendingCount,
      output: combinedOutput,
      trigger: "Manual - Web Dashboard",
      command,
      createdAt: activity.createdAt.toISOString(),
      user: activity.user,
    };

    return {
      success: true,
      run: runItem,
    };
  } catch (err) {
    console.error("Error executing project tests:", err);
    return {
      success: false,
      error: "An unexpected error occurred while executing project tests.",
    };
  }
}
