import dotenv from "dotenv";
dotenv.config();

import http from "http";
import express from "express";
import cors from "cors";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import { verifyTerminalToken } from "./auth.js";
import {
  WORKSPACES_ROOT,
  resolveWorkspaceDir,
  writeWorkspaceFile,
  deleteWorkspaceFile,
  syncInitialFiles,
  watchWorkspaceDir,
} from "./workspace.js";
import { PtyManager, PtySession } from "./pty-manager.js";

const PORT = Number(process.env.PORT) || 3001;
const TERMINAL_AUTH_SECRET = process.env.TERMINAL_AUTH_SECRET || "";

if (!TERMINAL_AUTH_SECRET && process.env.NODE_ENV === "production") {
  console.warn(
    "[Terminal Server] WARNING: TERMINAL_AUTH_SECRET is not defined in environment variables!"
  );
}

const app = express();
app.use(cors());
app.use(express.json());

const ptyManager = new PtyManager();

// Health Check Endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "devforge-terminal",
    platform: process.platform,
    nodeVersion: process.version,
    activeSessions: ptyManager.getActiveSessionCount(),
    workspacesRoot: WORKSPACES_ROOT,
    uptime: Math.floor(process.uptime()),
  });
});

app.get("/", (req, res) => {
  res.status(200).send("DevForge External Terminal Server is active.\n");
});

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

// Handle WebSocket upgrade manually to support token authentication at handshake
server.on("upgrade", (request, socket, head) => {
  const urlObj = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  const pathname = urlObj.pathname;

  // Accept connections to /terminal or root /
  if (pathname !== "/terminal" && pathname !== "/") {
    socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    socket.destroy();
    return;
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

wss.on("connection", async (ws: WebSocket, req) => {
  const urlObj = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const searchParams = urlObj.searchParams;

  const token =
    searchParams.get("token") ||
    (req.headers["sec-websocket-protocol"] ? req.headers["sec-websocket-protocol"].split(",")[0].trim() : null);

  const secret = TERMINAL_AUTH_SECRET || process.env.AUTH_SECRET || "";

  // Verify token
  if (!token) {
    console.warn("[Terminal Server] Connection rejected: No token provided.");
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Authentication failed: Missing terminal session token.",
      })
    );
    ws.close(4401, "Authentication token required");
    return;
  }

  const payload = verifyTerminalToken(token, secret);
  if (!payload) {
    console.warn("[Terminal Server] Connection rejected: Invalid or expired token.");
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Authentication failed: Invalid or expired session token.",
      })
    );
    ws.close(4403, "Invalid or expired token");
    return;
  }

  const { userId, projectId, projectSlug, workspaceId } = payload;
  console.log(`[Terminal Server] Authorized session for user ${userId}, project ${projectSlug}`);

  // Resolve isolated workspace directory
  let workspaceDir: string;
  try {
    workspaceDir = resolveWorkspaceDir(userId, projectSlug);
  } catch (err: any) {
    console.error("[Terminal Server] Workspace resolution error:", err);
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Access Denied: Invalid workspace path.",
      })
    );
    ws.close(4400, "Invalid workspace path");
    return;
  }

  // Parse terminal dimensions
  const cols = parseInt(searchParams.get("cols") || "80", 10);
  const rows = parseInt(searchParams.get("rows") || "24", 10);

  // Watch for disk file modifications to inform client
  const unwatchFs = watchWorkspaceDir(workspaceDir, () => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "fs_change",
          projectId,
          projectSlug,
        })
      );
    }
  });

  // Attach or spawn PTY session
  let session: PtySession;
  try {
    session = ptyManager.attachOrCreateSession({
      userId,
      projectId,
      projectSlug,
      workspaceDir,
      cols,
      rows,
      ws,
      onOutput: (data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "output", data }));
        }
      },
      onExit: (code, signal) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "exit", code, signal }));
          ws.close();
        }
      },
    });
  } catch (err: any) {
    console.error("[Terminal Server] PTY spawn error:", err);
    ws.send(
      JSON.stringify({
        type: "error",
        message: err?.message || "Failed to initialize terminal process.",
      })
    );
    unwatchFs();
    ws.close(1011, "PTY creation failed");
    return;
  }

  // Send ready lifecycle message
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "ready" }));
    ws.send(
      JSON.stringify({
        type: "status",
        status: "connected",
        pid: session.ptyProcess.pid,
        shell: path.basename(session.shell),
        cwd: workspaceDir,
        projectId,
        projectSlug,
      })
    );
  }

  // Handle incoming messages from browser xterm
  ws.on("message", (raw) => {
    try {
      const msgStr = raw.toString();
      let parsed: any;
      try {
        parsed = JSON.parse(msgStr);
      } catch {
        // Raw string input fallback
        ptyManager.write(session, msgStr);
        return;
      }

      switch (parsed.type) {
        case "input":
          if (typeof parsed.data === "string") {
            ptyManager.write(session, parsed.data);
          }
          break;

        case "resize": {
          const c = Number(parsed.cols);
          const r = Number(parsed.rows);
          if (c > 0 && r > 0) {
            ptyManager.resize(session, c, r);
          }
          break;
        }

        case "signal":
          ptyManager.kill(session, parsed.signal || "SIGINT");
          break;

        case "file_write":
          if (typeof parsed.path === "string" && typeof parsed.content === "string") {
            try {
              writeWorkspaceFile(workspaceDir, parsed.path, parsed.content);
            } catch (err) {
              console.warn("[Terminal Server] File write error:", err);
            }
          }
          break;

        case "file_delete":
          if (typeof parsed.path === "string") {
            try {
              deleteWorkspaceFile(workspaceDir, parsed.path);
            } catch (err) {
              console.warn("[Terminal Server] File delete error:", err);
            }
          }
          break;

        case "sync_files":
          if (Array.isArray(parsed.files)) {
            try {
              syncInitialFiles(workspaceDir, parsed.files);
            } catch (err) {
              console.warn("[Terminal Server] Sync files error:", err);
            }
          }
          break;

        case "ping":
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "pong" }));
          }
          break;

        default:
          break;
      }
    } catch (err) {
      console.error("[Terminal Server] Error processing message:", err);
    }
  });

  ws.on("close", () => {
    unwatchFs();
    ptyManager.handleClientDisconnect(session, ws);
  });

  ws.on("error", (err) => {
    console.error("[Terminal Server] WebSocket error:", err);
  });
});

// Graceful shutdown handling
function handleShutdown() {
  console.log("[Terminal Server] Received termination signal. Cleaning up...");
  ptyManager.shutdown();
  wss.close(() => {
    server.close(() => {
      console.log("[Terminal Server] Cleanly stopped.");
      process.exit(0);
    });
  });

  // Force exit after 5 seconds if still lingering
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on("SIGTERM", handleShutdown);
process.on("SIGINT", handleShutdown);

server.listen(PORT, () => {
  console.log(`[Terminal Server] Listening on http://localhost:${PORT}`);
  console.log(`[Terminal Server] WebSocket endpoint active at /terminal`);
  console.log(`[Terminal Server] Isolated workspaces root: ${WORKSPACES_ROOT}`);
});
