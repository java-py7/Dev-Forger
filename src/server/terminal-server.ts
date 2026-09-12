import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import * as pty from "node-pty";
import fs from "fs";
import path from "path";
import {
  WORKSPACES_ROOT,
  validateTerminalTicket,
  getProjectWorkspaceDir,
  watchWorkspace,
  sanitizeProjectSlug,
} from "./workspace-manager";

const DEFAULT_PORT = Number(process.env.TERMINAL_PORT) || 3001;

// ---------------------------------------------------------------------------
// PTY Session Pool — keeps shell processes alive for 30 s after disconnect
// so that a reconnecting client reattaches to the same shell.
// ---------------------------------------------------------------------------
interface PtySession {
  ptyProcess: pty.IPty;
  projectId: string;
  workspaceDir: string;
  shell: string;
  args: string[];
  killTimer: NodeJS.Timeout | null;
  activeWs: WebSocket | null;
  outputDisposable: pty.IDisposable | null;
  exitDisposable: pty.IDisposable | null;
}

declare global {
  // eslint-disable-next-line no-var
  var __ptySessions: Map<string, PtySession> | undefined;
}

const ptySessions = globalThis.__ptySessions ?? new Map<string, PtySession>();
globalThis.__ptySessions = ptySessions;

/** Key used to look up a reusable PTY for a given project+user. */
function sessionKey(projectId: string, userId: string) {
  return `${projectId}::${userId}`;
}

// Guard against Windows ConPTY AttachConsole cleanup edge-case and port conflicts on hot-reload
process.on("uncaughtException", (err: any) => {
  if (
    err?.message?.includes("AttachConsole") ||
    err?.code === "EPIPE" ||
    err?.code === "EADDRINUSE" // already running from a previous hot-reload cycle
  ) {
    return;
  }
  console.error("[Terminal Server] Uncaught exception:", err);
});

export interface TerminalServerInstance {
  server: http.Server;
  wss: WebSocketServer;
  close: () => Promise<void>;
}

declare global {
  // eslint-disable-next-line no-var
  var __terminalServerInstance: TerminalServerInstance | undefined;
}

// Generate shared helper profile for PowerShell on Windows
function ensurePowerShellProfile(): string {
  const profilePath = path.join(WORKSPACES_ROOT, ".devforge_profile.ps1");
  const script = `# DevForge Shell Profile
function touch {
    foreach ($f in $args) {
        if (-not (Test-Path $f)) {
            New-Item -ItemType File -Path $f -Force | Out-Null
        } else {
            (Get-Item $f).LastWriteTime = Get-Date
        }
    }
}
`;
  try {
    if (!fs.existsSync(profilePath) || fs.readFileSync(profilePath, "utf8") !== script) {
      fs.writeFileSync(profilePath, script, "utf8");
    }
  } catch {}
  return profilePath;
}

export function getAvailableShell(): { shell: string; args: string[] } {
  if (process.platform === "win32") {
    const systemRoot = process.env.SystemRoot || "C:\\Windows";
    const powershellPath = path.join(
      systemRoot,
      "System32",
      "WindowsPowerShell",
      "v1.0",
      "powershell.exe"
    );

    if (fs.existsSync(powershellPath)) {
      const profilePath = ensurePowerShellProfile();
      return {
        shell: powershellPath,
        args: [
          "-NoLogo",
          "-NoExit",
          "-ExecutionPolicy",
          "Bypass",
          "-Command",
          `. '${profilePath.replace(/\\/g, "/")}'`,
        ],
      };
    }
    return { shell: process.env.COMSPEC || "cmd.exe", args: [] };
  }

  // Unix / macOS
  const userShell = process.env.SHELL;
  if (userShell && fs.existsSync(userShell)) {
    return { shell: userShell, args: ["-l"] };
  }

  if (fs.existsSync("/bin/bash")) {
    return { shell: "/bin/bash", args: ["-l"] };
  }
  return { shell: "/bin/sh", args: [] };
}

export function startTerminalServer(port: number = DEFAULT_PORT): Promise<TerminalServerInstance> {
  if (globalThis.__terminalServerInstance) {
    console.log(`[Terminal Server] Reusing active instance on port ${port}`);
    return Promise.resolve(globalThis.__terminalServerInstance);
  }

  return new Promise((resolve, reject) => {
    const activeSessions = new Set<pty.IPty>();

    const server = http.createServer((req, res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

      if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
      }

      if (req.url === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "ok",
            activeSessions: activeSessions.size,
            platform: process.platform,
            nodeVersion: process.version,
            workspacesRoot: WORKSPACES_ROOT,
          })
        );
        return;
      }

      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("DevForge Terminal WebSocket Server is running.\n");
    });

    const wss = new WebSocketServer({ server });

    wss.on("connection", (ws: WebSocket, req) => {
      const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
      const initialCols = parseInt(url.searchParams.get("cols") || "80", 10);
      const initialRows = parseInt(url.searchParams.get("rows") || "24", 10);

      const ticketParam = url.searchParams.get("ticket");
      const projectIdParam = url.searchParams.get("projectId");
      const projectSlugParam = url.searchParams.get("projectSlug");

      let resolvedCwd = "";
      let activeProjectId = projectIdParam || "";
      let activeUserId = "anon";

      // 1. Check ticket authorization first
      if (ticketParam) {
        const ticketData = validateTerminalTicket(ticketParam);
        if (ticketData) {
          resolvedCwd = ticketData.workspaceDir;
          activeProjectId = ticketData.projectId;
          activeUserId = ticketData.userId;
        } else {
          console.warn("[Terminal] Invalid or expired ticket received");
        }
      }

      // 2. Direct project resolution fallback (if projectSlug or projectId provided)
      if (!resolvedCwd && (projectSlugParam || projectIdParam)) {
        try {
          const targetSlug = sanitizeProjectSlug(projectSlugParam || projectIdParam || "");
          if (targetSlug) {
            resolvedCwd = getProjectWorkspaceDir(targetSlug);
          }
        } catch (e: any) {
          console.warn("[Terminal] Failed to resolve project slug:", e.message);
        }
      }

      // 3. Ensure security: Directory must exist and must be inside WORKSPACES_ROOT
      if (!resolvedCwd || !resolvedCwd.startsWith(WORKSPACES_ROOT)) {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Access Denied: Terminal must be attached to a valid DevForge project workspace.",
          })
        );
        ws.close();
        return;
      }

      // Ensure directory exists on disk
      if (!fs.existsSync(resolvedCwd)) {
        try {
          fs.mkdirSync(resolvedCwd, { recursive: true });
        } catch {}
      }

      const spawnPty = (cwd: string, cols: number, rows: number) => {
        const { shell, args } = getAvailableShell();
        console.log(
          `[Terminal] Spawning shell in project workspace: ${cwd} (shell: ${path.basename(shell)})`
        );
        const newPty = pty.spawn(shell, args, {
          name: "xterm-256color",
          cols: cols > 0 ? cols : 80,
          rows: rows > 0 ? rows : 24,
          cwd,
          env: {
            ...process.env,
            TERM: "xterm-256color",
            COLORTERM: "truecolor",
          } as Record<string, string>,
        });
        activeSessions.add(newPty);
        return { ptyProcess: newPty, shell, args };
      };

      // ------------------------------------------------------------------
      // Reattach to existing PTY or spawn fresh one
      // ------------------------------------------------------------------
      const sKey = sessionKey(activeProjectId, activeUserId);
      let session = ptySessions.get(sKey);

      if (session && session.ptyProcess.pid) {
        // Cancel pending kill timer immediately
        if (session.killTimer) {
          clearTimeout(session.killTimer);
          session.killTimer = null;
        }

        // If an older WebSocket was still linked, cleanly supersede it
        if (session.activeWs && session.activeWs !== ws) {
          try {
            const oldWs = session.activeWs;
            session.activeWs = null;
            oldWs.close(1000, "Superseded by new terminal connection");
          } catch {}
        }

        // Dispose previous output and exit listeners so output is never duplicated
        if (session.outputDisposable) {
          try { session.outputDisposable.dispose(); } catch {}
          session.outputDisposable = null;
        }
        if (session.exitDisposable) {
          try { session.exitDisposable.dispose(); } catch {}
          session.exitDisposable = null;
        }

        console.log(
          `[Terminal] Reattaching to existing PTY (pid ${session.ptyProcess.pid}) for project ${activeProjectId}`
        );
      } else {
        const spawned = spawnPty(resolvedCwd, initialCols, initialRows);
        session = {
          ptyProcess: spawned.ptyProcess,
          projectId: activeProjectId,
          workspaceDir: resolvedCwd,
          shell: spawned.shell,
          args: spawned.args,
          killTimer: null,
          activeWs: null,
          outputDisposable: null,
          exitDisposable: null,
        };
        ptySessions.set(sKey, session);
      }

      // Link current WebSocket to the active session
      session.activeWs = ws;

      const currentSession = session;
      const ptyProcess = currentSession.ptyProcess;

      // Notify client that terminal process is ready
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: "status",
            status: "connected",
            pid: ptyProcess.pid,
            shell: path.basename(currentSession.shell),
            cwd: currentSession.workspaceDir,
            projectId: activeProjectId,
          })
        );
      }

      // Resize to match the new client's viewport
      try {
        if (initialCols > 0 && initialRows > 0) {
          ptyProcess.resize(initialCols, initialRows);
        }
      } catch {}

      // Stream PTY output strictly to THIS active WebSocket
      const outputDisposable = ptyProcess.onData((data: string) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "output",
              data,
            })
          );
        }
      });
      currentSession.outputDisposable = outputDisposable;

      // Handle PTY process exit
      const exitDisposable = ptyProcess.onExit(({ exitCode, signal }) => {
        console.log(`[Terminal] Shell process exited (code ${exitCode}, signal ${signal})`);
        activeSessions.delete(ptyProcess);
        ptySessions.delete(sKey);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "exit",
              exitCode,
              signal,
            })
          );
          ws.close();
        }
      });
      currentSession.exitDisposable = exitDisposable;

      // Set up filesystem watcher for this connection
      const unwatchFs = watchWorkspace(currentSession.workspaceDir, () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "fs_change",
              projectId: activeProjectId,
              dir: currentSession.workspaceDir,
            })
          );
        }
      });

      // Handle incoming messages from frontend xterm
      ws.on("message", (rawMessage) => {
        try {
          const messageStr = rawMessage.toString();
          let parsed: any;
          try {
            parsed = JSON.parse(messageStr);
          } catch {
            currentSession.ptyProcess.write(messageStr);
            return;
          }

          if (parsed.type === "input" && typeof parsed.data === "string") {
            currentSession.ptyProcess.write(parsed.data);
          } else if (parsed.type === "resize") {
            const cols = Number(parsed.cols);
            const rows = Number(parsed.rows);
            if (cols > 0 && rows > 0 && !isNaN(cols) && !isNaN(rows)) {
              try { currentSession.ptyProcess.resize(cols, rows); } catch {}
            }
          } else if (parsed.type === "ping") {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "pong" }));
            }
          } else if (parsed.type === "restart") {
            console.log(`[Terminal] Explicit restart requested for session ${sKey}`);
            try {
              currentSession.outputDisposable?.dispose();
              currentSession.exitDisposable?.dispose();
              activeSessions.delete(currentSession.ptyProcess);
              currentSession.ptyProcess.kill();
            } catch {}

            const cols = Number(parsed.cols) || initialCols;
            const rows = Number(parsed.rows) || initialRows;
            const spawned = spawnPty(currentSession.workspaceDir, cols, rows);
            currentSession.ptyProcess = spawned.ptyProcess;
            currentSession.shell = spawned.shell;
            currentSession.args = spawned.args;

            currentSession.outputDisposable = currentSession.ptyProcess.onData((data: string) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "output", data }));
              }
            });

            currentSession.exitDisposable = currentSession.ptyProcess.onExit(({ exitCode, signal }) => {
              activeSessions.delete(currentSession.ptyProcess);
              ptySessions.delete(sKey);
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "exit", exitCode, signal }));
                ws.close();
              }
            });

            if (ws.readyState === WebSocket.OPEN) {
              ws.send(
                JSON.stringify({
                  type: "status",
                  status: "connected",
                  pid: currentSession.ptyProcess.pid,
                  shell: path.basename(currentSession.shell),
                  cwd: currentSession.workspaceDir,
                  projectId: activeProjectId,
                  restarted: true,
                })
              );
            }
          }
        } catch (error) {
          console.error("[Terminal] Error handling message:", error);
        }
      });

      // Clean up on WebSocket disconnect — keep PTY alive for 30 s (grace period)
      ws.on("close", () => {
        // Always unregister this connection's fs watcher
        try { unwatchFs(); } catch {}

        // Only manage PTY session lifecycle if THIS socket was the active one
        if (currentSession.activeWs === ws) {
          console.log(
            `[Terminal] Active client disconnected — keeping PTY alive for 30 s (pid ${currentSession.ptyProcess.pid})`
          );
          currentSession.activeWs = null;
          if (currentSession.outputDisposable) {
            try { currentSession.outputDisposable.dispose(); } catch {}
            currentSession.outputDisposable = null;
          }
          if (currentSession.exitDisposable) {
            try { currentSession.exitDisposable.dispose(); } catch {}
            currentSession.exitDisposable = null;
          }

          // Schedule PTY kill after 30s grace period only if no new socket attaches
          currentSession.killTimer = setTimeout(() => {
            if (currentSession.activeWs === null) {
              console.log(
                `[Terminal] Grace period expired — killing PTY (pid ${currentSession.ptyProcess.pid})`
              );
              activeSessions.delete(currentSession.ptyProcess);
              ptySessions.delete(sKey);
              try { currentSession.ptyProcess.kill(); } catch {}
            }
          }, 30_000);
        } else {
          console.log(`[Terminal] Inactive/superseded socket closed cleanly.`);
        }
      });

      ws.on("error", (err) => {
        console.error("[Terminal] WebSocket error:", err);
      });
    });

    server.on("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        // Port is already held — likely a previous hot-reload cycle's server.
        // Resolve gracefully so Next.js does not crash; the existing process
        // is already handling WebSocket connections.
        console.log(
          `[Terminal Server] Port ${port} already in use — reusing existing terminal server.`
        );
        // Close the un-bound server/wss objects we just created
        try { wss.close(); } catch {}
        try { server.close(); } catch {}
        resolve({
          server,
          wss,
          close: () => Promise.resolve(),
        });
      } else {
        console.error("[Terminal Server] Server error:", err);
        reject(err);
      }
    });

    server.listen(port, () => {
      console.log(`[Terminal Server] Listening for WebSocket connections on port ${port}`);
      const instance: TerminalServerInstance = {
        server,
        wss,
        close: () =>
          new Promise<void>((closeResolve) => {
            for (const session of activeSessions) {
              try {
                session.kill();
              } catch {}
            }
            activeSessions.clear();
            wss.close(() => {
              server.close(() => closeResolve());
            });
          }),
      };
      globalThis.__terminalServerInstance = instance;
      resolve(instance);
    });
  });
}

const isDirectRun =
  typeof process !== "undefined" &&
  process.argv[1] &&
  (process.argv[1].endsWith("terminal-server.ts") || process.argv[1].endsWith("terminal-server.js"));

if (isDirectRun) {
  startTerminalServer()
    .then(() => {
      console.log("[Terminal Server] Standalone server started successfully.");
    })
    .catch((err) => {
      console.error("[Terminal Server] Failed to start:", err);
      process.exit(1);
    });
}
