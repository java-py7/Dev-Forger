import * as pty from "node-pty";
import fs from "fs";
import path from "path";
import { WebSocket } from "ws";

export interface PtySession {
  sessionId: string;
  userId: string;
  projectId: string;
  projectSlug: string;
  workspaceDir: string;
  ptyProcess: pty.IPty;
  shell: string;
  args: string[];
  activeWs: WebSocket | null;
  killTimer: NodeJS.Timeout | null;
  idleTimer: NodeJS.Timeout | null;
  outputDisposable: pty.IDisposable | null;
  exitDisposable: pty.IDisposable | null;
  createdAt: number;
  lastActivity: number;
}

const MAX_SESSIONS_PER_USER = 5;
const MAX_TOTAL_SESSIONS = 100;
const RECONNECT_GRACE_PERIOD_MS = 30_000; // 30 seconds
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export class PtyManager {
  private sessions = new Map<string, PtySession>();

  constructor() {
    // Guard against Windows ConPTY cleanup edge cases
    process.on("uncaughtException", (err: any) => {
      if (
        err?.message?.includes("AttachConsole") ||
        err?.code === "EPIPE" ||
        err?.code === "EADDRINUSE"
      ) {
        return;
      }
      console.error("[PTY Manager] Uncaught exception:", err);
    });
  }

  public getActiveSessionCount(): number {
    return this.sessions.size;
  }

  private sessionKey(userId: string, projectId: string): string {
    return `${userId}::${projectId}`;
  }

  public getAvailableShell(): { shell: string; args: string[] } {
    if (process.platform === "win32") {
      const systemRoot = process.env.SystemRoot || "C:\\Windows";
      const powershell = path.join(
        systemRoot,
        "System32",
        "WindowsPowerShell",
        "v1.0",
        "powershell.exe"
      );
      if (fs.existsSync(powershell)) {
        return {
          shell: powershell,
          args: ["-NoLogo", "-ExecutionPolicy", "Bypass"],
        };
      }
      return { shell: process.env.COMSPEC || "cmd.exe", args: [] };
    }

    // Linux / Unix / Container
    if (fs.existsSync("/bin/bash")) {
      return { shell: "/bin/bash", args: ["-l"] };
    }

    const envShell = process.env.SHELL;
    if (envShell && fs.existsSync(envShell)) {
      return { shell: envShell, args: ["-l"] };
    }

    return { shell: "/bin/sh", args: [] };
  }

  /**
   * Spawns a new PTY process or reattaches to an existing active session.
   */
  public attachOrCreateSession({
    userId,
    projectId,
    projectSlug,
    workspaceDir,
    cols = 80,
    rows = 24,
    ws,
    onOutput,
    onExit,
  }: {
    userId: string;
    projectId: string;
    projectSlug: string;
    workspaceDir: string;
    cols?: number;
    rows?: number;
    ws: WebSocket;
    onOutput: (data: string) => void;
    onExit: (code: number, signal?: number) => void;
  }): PtySession {
    const key = this.sessionKey(userId, projectId);
    let session = this.sessions.get(key);

    // If an existing session is still alive, cancel pending kill timer and reattach
    if (session && session.ptyProcess.pid) {
      if (session.killTimer) {
        clearTimeout(session.killTimer);
        session.killTimer = null;
      }

      // If an older WebSocket is still connected, cleanly close it
      if (session.activeWs && session.activeWs !== ws) {
        try {
          const oldWs = session.activeWs;
          session.activeWs = null;
          oldWs.close(1000, "Superseded by new terminal connection");
        } catch {}
      }

      // Dispose previous event listeners to avoid duplicated output
      try { session.outputDisposable?.dispose(); } catch {}
      try { session.exitDisposable?.dispose(); } catch {}

      session.outputDisposable = null;
      session.exitDisposable = null;
      session.activeWs = ws;
      session.lastActivity = Date.now();

      // Resize to match client dimensions
      try {
        if (cols > 0 && rows > 0) {
          session.ptyProcess.resize(cols, rows);
        }
      } catch {}

      this.wireSessionListeners(session, onOutput, onExit);
      this.resetIdleTimer(session);

      console.log(`[PTY Manager] Reattached to existing PTY (pid ${session.ptyProcess.pid}) for ${key}`);
      return session;
    }

    // Check system limits
    if (this.sessions.size >= MAX_TOTAL_SESSIONS) {
      throw new Error("Server terminal capacity reached. Please try again later.");
    }

    // Check user limit
    let userSessions = 0;
    for (const s of this.sessions.values()) {
      if (s.userId === userId) userSessions++;
    }
    if (userSessions >= MAX_SESSIONS_PER_USER) {
      throw new Error(`Maximum concurrent sessions (${MAX_SESSIONS_PER_USER}) exceeded for this user.`);
    }

    // Determine shell
    const { shell, args } = this.getAvailableShell();

    console.log(
      `[PTY Manager] Spawning new PTY shell: ${shell} in ${workspaceDir} for ${key}`
    );

    const safeCols = cols > 0 ? cols : 80;
    const safeRows = rows > 0 ? rows : 24;

    const ptyProcess = pty.spawn(shell, args, {
      name: "xterm-256color",
      cols: safeCols,
      rows: safeRows,
      cwd: workspaceDir,
      env: {
        ...process.env,
        TERM: "xterm-256color",
        COLORTERM: "truecolor",
        LANG: "en_US.UTF-8",
        PWD: workspaceDir,
        DEVFORGE_PROJECT: projectSlug,
        DEVFORGE_USER: userId,
      } as Record<string, string>,
    });

    session = {
      sessionId: `${key}::${Date.now()}`,
      userId,
      projectId,
      projectSlug,
      workspaceDir,
      ptyProcess,
      shell,
      args,
      activeWs: ws,
      killTimer: null,
      idleTimer: null,
      outputDisposable: null,
      exitDisposable: null,
      createdAt: Date.now(),
      lastActivity: Date.now(),
    };

    this.sessions.set(key, session);
    this.wireSessionListeners(session, onOutput, onExit);
    this.resetIdleTimer(session);

    return session;
  }

  private wireSessionListeners(
    session: PtySession,
    onOutput: (data: string) => void,
    onExit: (code: number, signal?: number) => void
  ): void {
    const key = this.sessionKey(session.userId, session.projectId);

    // Output stream
    session.outputDisposable = session.ptyProcess.onData((data: string) => {
      session.lastActivity = Date.now();
      this.resetIdleTimer(session);
      try {
        onOutput(data);
      } catch (err) {
        console.warn("[PTY Manager] Failed to dispatch PTY output:", err);
      }
    });

    // Exit listener
    session.exitDisposable = session.ptyProcess.onExit(({ exitCode, signal }) => {
      console.log(`[PTY Manager] Process exited: pid ${session.ptyProcess.pid} (code: ${exitCode}, signal: ${signal})`);
      this.cleanUpSession(session);
      try {
        onExit(exitCode, signal);
      } catch {}
    });
  }

  private resetIdleTimer(session: PtySession): void {
    if (session.idleTimer) {
      clearTimeout(session.idleTimer);
    }
    session.idleTimer = setTimeout(() => {
      console.log(`[PTY Manager] Session ${session.sessionId} timed out due to inactivity.`);
      this.cleanUpSession(session);
      try {
        session.ptyProcess.kill();
      } catch {}
      if (session.activeWs && session.activeWs.readyState === WebSocket.OPEN) {
        session.activeWs.close(1000, "Session closed due to inactivity.");
      }
    }, IDLE_TIMEOUT_MS);
  }

  /**
   * Called when a client's WebSocket closes. Keeps PTY alive for a grace period.
   */
  public handleClientDisconnect(session: PtySession, ws: WebSocket): void {
    if (session.activeWs !== ws) {
      // Inactive/superseded socket closed, nothing to do
      return;
    }

    session.activeWs = null;
    try { session.outputDisposable?.dispose(); } catch {}
    try { session.exitDisposable?.dispose(); } catch {}
    session.outputDisposable = null;
    session.exitDisposable = null;

    console.log(
      `[PTY Manager] Client disconnected. Starting ${RECONNECT_GRACE_PERIOD_MS / 1000}s grace period for session ${session.sessionId}`
    );

    // Schedule cleanup if client doesn't reconnect within grace period
    session.killTimer = setTimeout(() => {
      if (session.activeWs === null) {
        console.log(`[PTY Manager] Grace period expired for ${session.sessionId}. Killing process.`);
        this.cleanUpSession(session);
        try {
          session.ptyProcess.kill();
        } catch {}
      }
    }, RECONNECT_GRACE_PERIOD_MS);
  }

  /**
   * Forcibly cleans up and removes session from pool.
   */
  public cleanUpSession(session: PtySession): void {
    const key = this.sessionKey(session.userId, session.projectId);
    if (session.killTimer) {
      clearTimeout(session.killTimer);
      session.killTimer = null;
    }
    if (session.idleTimer) {
      clearTimeout(session.idleTimer);
      session.idleTimer = null;
    }
    try { session.outputDisposable?.dispose(); } catch {}
    try { session.exitDisposable?.dispose(); } catch {}
    session.outputDisposable = null;
    session.exitDisposable = null;
    this.sessions.delete(key);
  }

  /**
   * Sends input to the session's PTY.
   */
  public write(session: PtySession, data: string): void {
    session.lastActivity = Date.now();
    this.resetIdleTimer(session);
    session.ptyProcess.write(data);
  }

  /**
   * Resizes the session's PTY.
   */
  public resize(session: PtySession, cols: number, rows: number): void {
    if (cols > 0 && rows > 0) {
      try {
        session.ptyProcess.resize(cols, rows);
      } catch (err) {
        console.warn("[PTY Manager] Resize error:", err);
      }
    }
  }

  /**
   * Sends a signal to the session's PTY (e.g. SIGINT, SIGTERM).
   */
  public kill(session: PtySession, signal: string = "SIGINT"): void {
    if (signal === "SIGINT") {
      // Writing \x03 (Ctrl+C) is the most reliable way across Windows and Linux
      session.ptyProcess.write("\x03");
    } else {
      try {
        session.ptyProcess.kill(signal);
      } catch (err) {
        console.warn("[PTY Manager] Kill error:", err);
      }
    }
  }

  /**
   * Clean shutdown of all active PTY processes.
   */
  public shutdown(): void {
    console.log(`[PTY Manager] Shutting down ${this.sessions.size} sessions.`);
    for (const session of this.sessions.values()) {
      try {
        session.ptyProcess.kill();
      } catch {}
    }
    this.sessions.clear();
  }
}
