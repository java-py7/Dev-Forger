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

// Guard against Windows ConPTY AttachConsole cleanup edge-case
process.on("uncaughtException", (err: any) => {
  if (err?.message?.includes("AttachConsole") || err?.code === "EPIPE") {
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

      // 1. Check ticket authorization first
      if (ticketParam) {
        const ticketData = validateTerminalTicket(ticketParam);
        if (ticketData) {
          resolvedCwd = ticketData.workspaceDir;
          activeProjectId = ticketData.projectId;
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

      const { shell, args } = getAvailableShell();

      console.log(
        `[Terminal] Spawning shell in project workspace: ${resolvedCwd} (shell: ${path.basename(shell)})`
      );

      let ptyProcess: pty.IPty | null = null;

      try {
        ptyProcess = pty.spawn(shell, args, {
          name: "xterm-256color",
          cols: initialCols > 0 ? initialCols : 80,
          rows: initialRows > 0 ? initialRows : 24,
          cwd: resolvedCwd,
          env: {
            ...process.env,
            TERM: "xterm-256color",
            COLORTERM: "truecolor",
          } as Record<string, string>,
        });
      } catch (err: any) {
        console.error("[Terminal] Failed to spawn PTY:", err);
        ws.send(
          JSON.stringify({
            type: "error",
            message: `Failed to spawn shell: ${err.message}`,
          })
        );
        ws.close();
        return;
      }

      activeSessions.add(ptyProcess);

      // Notify client that terminal process is spawned
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: "status",
            status: "connected",
            pid: ptyProcess.pid,
            shell: path.basename(shell),
            cwd: resolvedCwd,
            projectId: activeProjectId,
          })
        );
      }

      // Set up filesystem watcher for Explorer live synchronization
      let unwatchFs: (() => void) | null = null;
      if (resolvedCwd) {
        unwatchFs = watchWorkspace(resolvedCwd, () => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: "fs_change",
                projectId: activeProjectId,
                dir: resolvedCwd,
              })
            );
          }
        });
      }

      // Stream PTY output to WebSocket
      ptyProcess.onData((data: string) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "output",
              data,
            })
          );
        }
      });

      // Handle PTY process exit
      ptyProcess.onExit(({ exitCode, signal }) => {
        console.log(`[Terminal] Shell process exited (code ${exitCode}, signal ${signal})`);
        if (ptyProcess) {
          activeSessions.delete(ptyProcess);
          ptyProcess = null;
        }
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

      // Handle incoming messages from frontend xterm
      ws.on("message", (rawMessage) => {
        if (!ptyProcess) return;

        try {
          const messageStr = rawMessage.toString();
          let parsed: any;
          try {
            parsed = JSON.parse(messageStr);
          } catch {
            ptyProcess.write(messageStr);
            return;
          }

          if (parsed.type === "input" && typeof parsed.data === "string") {
            ptyProcess.write(parsed.data);
          } else if (parsed.type === "resize") {
            const cols = Number(parsed.cols);
            const rows = Number(parsed.rows);
            if (cols > 0 && rows > 0 && !isNaN(cols) && !isNaN(rows)) {
              ptyProcess.resize(cols, rows);
            }
          } else if (parsed.type === "ping") {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "pong" }));
            }
          }
        } catch (error) {
          console.error("[Terminal] Error handling message:", error);
        }
      });

      // Clean up on WebSocket disconnect
      ws.on("close", () => {
        console.log("[Terminal] Client disconnected, killing PTY session");
        if (unwatchFs) {
          try {
            unwatchFs();
          } catch {}
          unwatchFs = null;
        }

        if (ptyProcess) {
          activeSessions.delete(ptyProcess);
          try {
            ptyProcess.kill();
          } catch {}
          ptyProcess = null;
        }
      });

      ws.on("error", (err) => {
        console.error("[Terminal] WebSocket error:", err);
      });
    });

    server.on("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        console.warn(`[Terminal Server] Port ${port} is already in use. Assuming server is active.`);
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
