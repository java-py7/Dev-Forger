"use client";

import { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from "react";
import "@xterm/xterm/css/xterm.css";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTerminalTicketAction } from "@/app/(dashboard)/projects/[slug]/workspace-actions";

export interface XTermTerminalHandle {
  clear: () => void;
  reconnect: () => void;
  restart: () => void;
  focus: () => void;
}

// Maximum bytes to keep in the replay buffer (2 MB)
const MAX_BUFFER_BYTES = 2 * 1024 * 1024;

interface XTermTerminalProps {
  isVisible?: boolean;
  projectId?: string;
  projectSlug?: string;
  cwd?: string;
  wsUrl?: string;
  onStatusChange?: (status: "connecting" | "connected" | "disconnected" | "error") => void;
  onFilesChanged?: () => void;
}

export const XTermTerminal = forwardRef<XTermTerminalHandle, XTermTerminalProps>(
  function XTermTerminal(
    {
      isVisible = true,
      projectId,
      projectSlug,
      cwd,
      wsUrl,
      onStatusChange,
      onFilesChanged,
    },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const terminalRef = useRef<any>(null);
    const fitAddonRef = useRef<any>(null);
    const socketRef = useRef<WebSocket | null>(null);

    // Monotonic sequence counter to guarantee only the latest connection attempt is active
    const connectionSeqRef = useRef<number>(0);
    const initPromiseRef = useRef<Promise<void> | null>(null);

    // Stable ref for onFilesChanged callback
    const onFilesChangedRef = useRef(onFilesChanged);
    useEffect(() => {
      onFilesChangedRef.current = onFilesChanged;
    });

    // Replay buffer: accumulates PTY output so history survives tab switches
    const outputBufferRef = useRef<string>("");

    // Timers
    const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const fsChangeDebounceRef = useRef<NodeJS.Timeout | null>(null);

    const [status, setStatus] = useState<"connecting" | "connected" | "disconnected" | "error">(
      "connecting"
    );
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const updateStatus = useCallback(
      (newStatus: "connecting" | "connected" | "disconnected" | "error") => {
        setStatus(newStatus);
        onStatusChange?.(newStatus);
      },
      [onStatusChange]
    );

    // -----------------------------------------------------------------------
    // initTerminal — creates the xterm Terminal instance ONCE.
    // Keystroke forwarding (term.onData) is attached ONCE here.
    // -----------------------------------------------------------------------
    const initTerminal = useCallback(async () => {
      if (terminalRef.current) return;
      if (initPromiseRef.current) return initPromiseRef.current;

      initPromiseRef.current = (async () => {
        if (!containerRef.current) return;
        const { Terminal } = await import("@xterm/xterm");
        const { FitAddon } = await import("@xterm/addon-fit");

        if (terminalRef.current) return;

        const term = new Terminal({
          cursorBlink: true,
          cursorStyle: "bar",
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', 'Courier New', monospace",
          fontSize: 13,
          lineHeight: 1.25,
          letterSpacing: 0,
          allowTransparency: true,
          scrollback: 5000,
          theme: {
            background: "#080b11",
            foreground: "#f1f5f9",
            cursor: "#38bdf8",
            cursorAccent: "#080b11",
            selectionBackground: "rgba(56, 189, 248, 0.25)",
            selectionForeground: "#ffffff",
            black: "#1e293b",
            red: "#f87171",
            green: "#4ade80",
            yellow: "#facc15",
            blue: "#60a5fa",
            magenta: "#c084fc",
            cyan: "#38bdf8",
            white: "#f8fafc",
            brightBlack: "#475569",
            brightRed: "#ef4444",
            brightGreen: "#22c55e",
            brightYellow: "#eab308",
            brightBlue: "#3b82f6",
            brightMagenta: "#a855f7",
            brightCyan: "#06b6d4",
            brightWhite: "#ffffff",
          },
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);

        containerRef.current.innerHTML = "";
        term.open(containerRef.current);

        // Forward keystrokes strictly through the active WebSocket reference.
        // Attaching this ONCE prevents any possibility of double or triple keystrokes.
        term.onData((data: string) => {
          if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type: "input", data }));
          }
        });

        terminalRef.current = term;
        fitAddonRef.current = fitAddon;

        // Replay any buffered output from before this mount
        if (outputBufferRef.current) {
          term.write(outputBufferRef.current);
        }

        requestAnimationFrame(() => {
          try {
            fitAddon.fit();
          } catch {}
        });
      })().finally(() => {
        initPromiseRef.current = null;
      });

      return initPromiseRef.current;
    }, []);

    // -----------------------------------------------------------------------
    // connectSocket — strictly single-flight connection with sequence guard
    // -----------------------------------------------------------------------
    const connectSocket = useCallback(
      async (restartShell = false) => {
        const seq = ++connectionSeqRef.current;

        // Clear existing timers
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }

        // Close previous socket synchronously so it never lingers
        if (socketRef.current) {
          const prev = socketRef.current;
          socketRef.current = null;
          prev.onopen = null;
          prev.onclose = null;
          prev.onerror = null;
          prev.onmessage = null;
          try {
            prev.close();
          } catch {}
        }

        updateStatus("connecting");
        setErrorMessage(null);

        // Ensure xterm instance is initialized
        await initTerminal();
        if (seq !== connectionSeqRef.current) return;

        const term = terminalRef.current;
        const fitAddon = fitAddonRef.current;
        if (!term) return;

        // Request a secure terminal ticket
        let ticket = "";
        if (projectId) {
          try {
            const res = await getTerminalTicketAction(projectId);
            if (seq !== connectionSeqRef.current) return;
            if (res.success && res.ticketId) ticket = res.ticketId;
          } catch (e) {
            console.warn("[Terminal] Failed to fetch terminal ticket:", e);
          }
        }

        if (seq !== connectionSeqRef.current) return;

        // Determine WebSocket URL
        const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
        const resolvedWsUrl =
          wsUrl ||
          process.env.NEXT_PUBLIC_TERMINAL_WS_URL ||
          `ws://${host}:3001`;

        const params = new URLSearchParams();
        if (term.cols) params.set("cols", String(term.cols));
        if (term.rows) params.set("rows", String(term.rows));
        if (ticket) params.set("ticket", ticket);
        if (projectId) params.set("projectId", projectId);
        if (projectSlug) params.set("projectSlug", projectSlug);
        if (cwd) params.set("cwd", cwd);

        try {
          const ws = new WebSocket(`${resolvedWsUrl}?${params.toString()}`);
          socketRef.current = ws;

          // Guard against hanging connections: timeout after 8 seconds
          connectionTimeoutRef.current = setTimeout(() => {
            if (ws.readyState !== WebSocket.OPEN && seq === connectionSeqRef.current) {
              try {
                ws.close();
              } catch {}
              updateStatus("error");
              setErrorMessage("Connection to terminal server timed out. Make sure the server is running on port 3001.");
            }
          }, 8000);

          ws.onopen = () => {
            if (seq !== connectionSeqRef.current) {
              try {
                ws.close();
              } catch {}
              return;
            }
            if (connectionTimeoutRef.current) {
              clearTimeout(connectionTimeoutRef.current);
              connectionTimeoutRef.current = null;
            }

            updateStatus("connected");
            setErrorMessage(null);

            try {
              fitAddon?.fit();
              ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
            } catch {}

            if (restartShell) {
              ws.send(JSON.stringify({ type: "restart", cols: term.cols, rows: term.rows }));
            }

            term.focus();

            // Heartbeat ping every 20 seconds to prevent idle drops
            pingIntervalRef.current = setInterval(() => {
              if (ws.readyState === WebSocket.OPEN) {
                try {
                  ws.send(JSON.stringify({ type: "ping" }));
                } catch {}
              }
            }, 20000);
          };

          ws.onmessage = (event) => {
            if (seq !== connectionSeqRef.current) return;

            try {
              const msg = JSON.parse(event.data);
              if (msg.type === "output" && typeof msg.data === "string") {
                term.write(msg.data);
                outputBufferRef.current += msg.data;
                if (outputBufferRef.current.length > MAX_BUFFER_BYTES) {
                  outputBufferRef.current = outputBufferRef.current.slice(
                    outputBufferRef.current.length - MAX_BUFFER_BYTES
                  );
                }
              } else if (msg.type === "fs_change") {
                // Debounce filesystem change notifications by 200ms
                if (fsChangeDebounceRef.current) clearTimeout(fsChangeDebounceRef.current);
                fsChangeDebounceRef.current = setTimeout(() => {
                  onFilesChangedRef.current?.();
                  fsChangeDebounceRef.current = null;
                }, 200);
              } else if (msg.type === "exit") {
                term.write(`\r\n\x1b[33m[Process exited with code ${msg.exitCode}]\x1b[0m\r\n`);
                updateStatus("disconnected");
              } else if (msg.type === "error") {
                term.write(`\r\n\x1b[31m[Error: ${msg.message}]\x1b[0m\r\n`);
                setErrorMessage(msg.message);
              } else if (msg.type === "pong") {
                // Ping-pong alive
              }
            } catch {
              term.write(event.data);
            }
          };

          ws.onerror = () => {
            if (seq !== connectionSeqRef.current) return;
            if (connectionTimeoutRef.current) {
              clearTimeout(connectionTimeoutRef.current);
              connectionTimeoutRef.current = null;
            }
            updateStatus("error");
            setErrorMessage("Terminal connection failed. Please verify the terminal server is active.");
          };

          ws.onclose = () => {
            if (seq !== connectionSeqRef.current) return;
            if (connectionTimeoutRef.current) {
              clearTimeout(connectionTimeoutRef.current);
              connectionTimeoutRef.current = null;
            }
            if (pingIntervalRef.current) {
              clearInterval(pingIntervalRef.current);
              pingIntervalRef.current = null;
            }
            updateStatus("disconnected");
          };
        } catch (err: any) {
          if (seq !== connectionSeqRef.current) return;
          updateStatus("error");
          setErrorMessage(err?.message || "Failed to establish terminal connection.");
        }
      },
      [projectId, projectSlug, cwd, wsUrl, updateStatus, initTerminal]
    );

    // Lifecycle: connect on mount, clean up synchronously on unmount
    useEffect(() => {
      connectSocket(false);

      return () => {
        // Increment sequence so in-flight async operations self-abort
        connectionSeqRef.current++;

        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        if (fsChangeDebounceRef.current) {
          clearTimeout(fsChangeDebounceRef.current);
          fsChangeDebounceRef.current = null;
        }

        if (socketRef.current) {
          const s = socketRef.current;
          socketRef.current = null;
          s.onopen = null;
          s.onclose = null;
          s.onerror = null;
          s.onmessage = null;
          try {
            s.close();
          } catch {}
        }
      };
    }, [connectSocket]);

    // ResizeObserver to fit terminal when container dimensions change
    useEffect(() => {
      if (!containerRef.current || !fitAddonRef.current) return;

      const resizeObserver = new ResizeObserver(() => {
        if (!isVisible) return;
        requestAnimationFrame(() => {
          try {
            if (fitAddonRef.current && terminalRef.current) {
              fitAddonRef.current.fit();
              if (socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(
                  JSON.stringify({
                    type: "resize",
                    cols: terminalRef.current.cols,
                    rows: terminalRef.current.rows,
                  })
                );
              }
            }
          } catch {}
        });
      });

      resizeObserver.observe(containerRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }, [isVisible]);

    // Refit when isVisible changes to true
    useEffect(() => {
      if (isVisible && fitAddonRef.current) {
        setTimeout(() => {
          try {
            fitAddonRef.current.fit();
            terminalRef.current?.focus();
          } catch {}
        }, 50);
      }
    }, [isVisible]);

    // Expose methods to parent
    useImperativeHandle(
      ref,
      () => ({
        clear: () => {
          terminalRef.current?.clear();
          outputBufferRef.current = "";
        },
        reconnect: () => {
          terminalRef.current?.clear();
          outputBufferRef.current = "";
          connectSocket(false);
        },
        restart: () => {
          terminalRef.current?.clear();
          outputBufferRef.current = "";
          connectSocket(true);
        },
        focus: () => {
          terminalRef.current?.focus();
        },
      }),
      [connectSocket]
    );

    return (
      <div className="relative h-full w-full bg-[#080b11] overflow-hidden">
        <div
          ref={containerRef}
          className="h-full w-full px-2 py-1 select-text"
          style={{ height: "100%", width: "100%" }}
        />

        {status === "connecting" && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#080b11]/80 backdrop-blur-xs z-10">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span>Connecting to project workspace shell...</span>
            </div>
          </div>
        )}

        {(status === "disconnected" || status === "error") && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#080b11]/90 backdrop-blur-xs z-10">
            <div className="flex flex-col items-center gap-2 text-center p-4 max-w-sm rounded-lg border border-border bg-card/40">
              <AlertCircle className="size-5 text-destructive" />
              <p className="text-xs font-medium text-foreground">
                {errorMessage || "Terminal session disconnected"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Make sure the terminal WebSocket server is active on port 3001.
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => connectSocket(false)}
                className="mt-1 gap-1.5 text-xs h-7 cursor-pointer"
              >
                <RefreshCw className="size-3" />
                <span>Reconnect Terminal</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }
);
