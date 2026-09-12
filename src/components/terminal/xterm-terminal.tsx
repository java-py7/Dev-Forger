"use client";

import { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from "react";
import "@xterm/xterm/css/xterm.css";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTerminalTicketAction } from "@/app/(dashboard)/projects/[slug]/workspace-actions";

export interface XTermTerminalHandle {
  clear: () => void;
  reconnect: () => void;
  focus: () => void;
}

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

    const connectTerminal = useCallback(async () => {
      if (!containerRef.current) return;

      updateStatus("connecting");
      setErrorMessage(null);

      // Clean up previous socket if any
      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.onerror = null;
        socketRef.current.onmessage = null;
        socketRef.current.close();
        socketRef.current = null;
      }

      // Initialize xterm and fit addon dynamically if not already initialized
      if (!terminalRef.current) {
        const { Terminal } = await import("@xterm/xterm");
        const { FitAddon } = await import("@xterm/addon-fit");

        const term = new Terminal({
          cursorBlink: true,
          cursorStyle: "bar",
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', 'Courier New', monospace",
          fontSize: 13,
          lineHeight: 1.25,
          letterSpacing: 0,
          allowTransparency: true,
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

        terminalRef.current = term;
        fitAddonRef.current = fitAddon;

        requestAnimationFrame(() => {
          try {
            fitAddon.fit();
          } catch {}
        });
      }

      const term = terminalRef.current;
      const fitAddon = fitAddonRef.current;

      // Determine WebSocket URL
      const host =
        typeof window !== "undefined" ? window.location.hostname : "localhost";
      const resolvedWsUrl =
        wsUrl ||
        process.env.NEXT_PUBLIC_TERMINAL_WS_URL ||
        `ws://${host}:3001`;

      // Request secure terminal ticket if projectId is provided
      let ticket = "";
      if (projectId) {
        try {
          const res = await getTerminalTicketAction(projectId);
          if (res.success && res.ticketId) {
            ticket = res.ticketId;
          }
        } catch (e) {
          console.warn("[Terminal] Failed to fetch terminal ticket:", e);
        }
      }

      const params = new URLSearchParams();
      if (term.cols) params.set("cols", String(term.cols));
      if (term.rows) params.set("rows", String(term.rows));
      if (ticket) params.set("ticket", ticket);
      if (projectId) params.set("projectId", projectId);
      if (projectSlug) params.set("projectSlug", projectSlug);
      if (cwd) params.set("cwd", cwd);

      const fullUrl = `${resolvedWsUrl}?${params.toString()}`;

      try {
        const ws = new WebSocket(fullUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          updateStatus("connected");
          setErrorMessage(null);
          try {
            fitAddon.fit();
            ws.send(
              JSON.stringify({
                type: "resize",
                cols: term.cols,
                rows: term.rows,
              })
            );
          } catch {}
          term.focus();
        };

        let commandIdleTimer: NodeJS.Timeout | null = null;

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === "output" && typeof msg.data === "string") {
              term.write(msg.data);
              // Reset idle timer while output is streaming, trigger sync once command finishes
              if (commandIdleTimer) {
                clearTimeout(commandIdleTimer);
                commandIdleTimer = setTimeout(() => {
                  onFilesChanged?.();
                  commandIdleTimer = null;
                }, 500);
              }
            } else if (msg.type === "fs_change") {
              // Filesystem was modified on the server workspace (e.g. via terminal mkdir/touch/rm/npm)
              onFilesChanged?.();
            } else if (msg.type === "status") {
              // Connection status
            } else if (msg.type === "exit") {
              term.write(`\r\n\x1b[33m[Process exited with code ${msg.exitCode}]\x1b[0m\r\n`);
              updateStatus("disconnected");
            } else if (msg.type === "error") {
              term.write(`\r\n\x1b[31m[Error: ${msg.message}]\x1b[0m\r\n`);
              setErrorMessage(msg.message);
            }
          } catch {
            term.write(event.data);
          }
        };

        ws.onerror = () => {
          updateStatus("error");
          setErrorMessage("WebSocket connection to terminal server failed.");
        };

        ws.onclose = () => {
          updateStatus("disconnected");
        };

        const disposable = term.onData((data: string) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "input", data }));

            // If user pressed Enter, schedule idle sync to ensure file tree updates
            if (data.includes("\r") || data.includes("\n")) {
              if (commandIdleTimer) clearTimeout(commandIdleTimer);
              commandIdleTimer = setTimeout(() => {
                onFilesChanged?.();
                commandIdleTimer = null;
              }, 600);
            }
          }
        });

        return () => {
          if (commandIdleTimer) clearTimeout(commandIdleTimer);
          disposable.dispose();
        };
      } catch (err: any) {
        updateStatus("error");
        setErrorMessage(err?.message || "Failed to establish terminal connection.");
      }
    }, [projectId, projectSlug, cwd, wsUrl, updateStatus, onFilesChanged]);

    // Initial mount connection
    useEffect(() => {
      let cleanup: (() => void) | undefined;
      connectTerminal().then((c) => {
        cleanup = c;
      });

      return () => {
        cleanup?.();
        if (socketRef.current) {
          socketRef.current.close();
          socketRef.current = null;
        }
        if (terminalRef.current) {
          terminalRef.current.dispose();
          terminalRef.current = null;
        }
      };
    }, [connectTerminal]);

    // ResizeObserver to automatically fit terminal when container dimensions change
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
        },
        reconnect: () => {
          terminalRef.current?.clear();
          connectTerminal();
        },
        focus: () => {
          terminalRef.current?.focus();
        },
      }),
      [connectTerminal]
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
                onClick={connectTerminal}
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
