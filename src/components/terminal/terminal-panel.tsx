"use client";

import { useState, useRef, useEffect } from "react";
import {
  Terminal as TerminalIcon,
  Play,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Maximize2,
  Minimize2,
  RefreshCw,
  Circle,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { XTermTerminal, XTermTerminalHandle } from "./xterm-terminal";

export interface LogEntry {
  type: "info" | "warn" | "error" | "success";
  text: string;
  timestamp: string;
}

interface TerminalPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  logs: LogEntry[];
  onClearLogs: () => void;
  isRunning?: boolean;
  cwd?: string;
  projectId?: string;
  projectSlug?: string;
  onFilesChanged?: () => void;
  onDevServerDetected?: (url: string, port: number) => void;
  detectedServers?: Array<{ port: number; url: string }>;
  onOpenPreview?: (url?: string) => void;
}

export function TerminalPanel({
  isOpen,
  onToggle,
  logs,
  onClearLogs,
  isRunning = false,
  cwd,
  projectId,
  projectSlug,
  onFilesChanged,
  onDevServerDetected,
  detectedServers = [],
  onOpenPreview,
}: TerminalPanelProps) {
  const [activeTab, setActiveTab] = useState<"output" | "terminal" | "problems">(() => {
    if (typeof window !== "undefined") {
      const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      if (!isLocalhost && !process.env.NEXT_PUBLIC_TERMINAL_WS_URL) {
        return "output";
      }
    }
    return "terminal";
  });
  const [isExpandedFull, setIsExpandedFull] = useState(false);
  const [terminalStatus, setTerminalStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("connecting");

  const logEndRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTermTerminalHandle>(null);

  // Automatically switch to output tab when code execution begins
  useEffect(() => {
    if (isRunning) {
      setActiveTab("output");
    }
  }, [isRunning]);

  useEffect(() => {
    if (isOpen && activeTab === "output") {
      logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isOpen, activeTab]);

  return (
    <div
      className={cn(
        "flex w-full flex-col border-t bg-[#080b11] transition-all duration-150 select-none",
        !isOpen ? "h-8" : isExpandedFull ? "h-96" : "h-56"
      )}
    >
      {/* Collapsed Header Bar */}
      {!isOpen ? (
        <div className="flex h-8 w-full items-center justify-between border-b border-border/20 bg-muted/40 px-3 select-none text-xs">
          <button
            type="button"
            onClick={onToggle}
            className="flex items-center gap-2 font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <TerminalIcon className="size-3.5" />
            <span>Terminal / Console</span>
            <Circle
              className={cn(
                "size-2 fill-current transition-colors ml-0.5",
                terminalStatus === "connected"
                  ? "text-emerald-500 fill-emerald-500"
                  : terminalStatus === "connecting"
                  ? "text-amber-500 fill-amber-500 animate-pulse"
                  : "text-rose-500 fill-rose-500"
              )}
            />
            {logs.length > 0 && (
              <span className="flex size-4 items-center justify-center rounded-full bg-primary/20 text-[10px] font-semibold text-primary">
                {logs.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onToggle}
            className="flex size-6 items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            title="Expand Terminal"
          >
            <ChevronUp className="size-3.5" />
          </button>
        </div>
      ) : (
        /* Terminal Top Tabs Bar */
        <div className="flex h-8 items-center justify-between border-b border-border/40 bg-muted/30 px-3 text-xs">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("terminal")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-sm font-medium transition-colors cursor-pointer",
              activeTab === "terminal"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <TerminalIcon className="size-3" />
            <span>Terminal</span>
            {/* Status indicator dot */}
            <Circle
              className={cn(
                "size-2 fill-current transition-colors ml-0.5",
                terminalStatus === "connected"
                  ? "text-emerald-500 fill-emerald-500"
                  : terminalStatus === "connecting"
                  ? "text-amber-500 fill-amber-500 animate-pulse"
                  : "text-rose-500 fill-rose-500"
              )}
            />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("output")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-sm font-medium transition-colors cursor-pointer",
              activeTab === "output"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Play className="size-3" />
            <span>Output</span>
            {logs.length > 0 && (
              <span className="ml-1 rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-mono">
                {logs.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("problems")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-sm font-medium transition-colors cursor-pointer",
              activeTab === "problems"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <AlertCircle className="size-3" />
            <span>Problems</span>
          </button>
        </div>

        {/* Action icons right */}
        <div className="flex items-center gap-1.5">
          {detectedServers.length > 0 && (
            <button
              type="button"
              onClick={() => onOpenPreview?.(detectedServers[detectedServers.length - 1].url)}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors cursor-pointer mr-1"
              title="Click to open this running dev server in Live Preview"
            >
              <Globe className="size-3 animate-pulse text-emerald-400" />
              <span>Port {detectedServers[detectedServers.length - 1].port}</span>
              <span className="underline ml-0.5">Preview</span>
            </button>
          )}

          {activeTab === "terminal" && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Clear Terminal Screen"
                onClick={() => xtermRef.current?.clear()}
              >
                <Trash2 className="size-3" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Restart Shell Session"
                onClick={() => {
                  if (xtermRef.current?.restart) {
                    xtermRef.current.restart();
                  } else {
                    xtermRef.current?.reconnect();
                  }
                }}
              >
                <RefreshCw className="size-3" />
              </Button>
            </>
          )}

          {activeTab === "output" && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Clear Output"
              onClick={onClearLogs}
            >
              <Trash2 className="size-3" />
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6 text-muted-foreground hover:text-foreground cursor-pointer"
            title={isExpandedFull ? "Minimize" : "Maximize"}
            onClick={() => setIsExpandedFull(!isExpandedFull)}
          >
            {isExpandedFull ? (
              <Minimize2 className="size-3" />
            ) : (
              <Maximize2 className="size-3" />
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6 text-muted-foreground hover:text-foreground cursor-pointer"
            title="Collapse Terminal"
            onClick={onToggle}
          >
            <ChevronDown className="size-3.5" />
          </Button>
        </div>
        </div>
      )}

      {/* Content Area */}
      <div className={cn("flex-1 overflow-hidden relative", !isOpen && "hidden")}>
        {/* Real xterm.js terminal - preserved in DOM to maintain shell state */}
        <div
          className={cn(
            "h-full w-full",
            activeTab === "terminal" ? "block" : "hidden"
          )}
        >
          <XTermTerminal
            ref={xtermRef}
            isVisible={isOpen && activeTab === "terminal"}
            projectId={projectId}
            projectSlug={projectSlug}
            cwd={cwd}
            onStatusChange={setTerminalStatus}
            onFilesChanged={onFilesChanged}
            onDevServerDetected={onDevServerDetected}
          />
        </div>

        {/* Output tab */}
        {activeTab === "output" && (
          <div className="h-full overflow-y-auto p-3 font-mono text-xs select-text">
            <div className="space-y-1">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-muted-foreground/60 select-none">
                  <Sparkles className="size-5 mb-1 text-muted-foreground/40" />
                  <p>No output yet. Click &quot;Run&quot; above to execute current file.</p>
                </div>
              ) : (
                logs.map((log, index) => {
                  let color = "text-foreground";
                  if (log.type === "error") color = "text-destructive font-medium";
                  if (log.type === "warn") color = "text-amber-500 font-medium";
                  if (log.type === "success") color = "text-emerald-500 font-medium";

                  return (
                    <div key={index} className={cn("flex items-start gap-2 leading-relaxed", color)}>
                      <span className="shrink-0 text-muted-foreground/50 text-[10px] select-none">
                        {log.timestamp}
                      </span>
                      <span className="whitespace-pre-wrap break-all">{log.text}</span>
                    </div>
                  );
                })
              )}
              <div ref={logEndRef} />
            </div>
          </div>
        )}

        {/* Problems tab */}
        {activeTab === "problems" && (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground select-none">
            <CheckCircle2 className="size-5 mb-1 text-emerald-500" />
            <p className="text-xs">No problems detected in workspace files.</p>
          </div>
        )}
      </div>
    </div>
  );
}
