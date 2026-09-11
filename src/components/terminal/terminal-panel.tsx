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
  Clock,
  Sparkles,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
}

export function TerminalPanel({
  isOpen,
  onToggle,
  logs,
  onClearLogs,
  isRunning = false,
}: TerminalPanelProps) {
  const [activeTab, setActiveTab] = useState<"output" | "terminal" | "problems">("output");
  const [cliInput, setCliInput] = useState("");
  const [cliHistory, setCliHistory] = useState<string[]>([
    "DevForge Cloud Terminal v1.0.0",
    "Type 'help' for a list of available commands.",
  ]);
  const [isExpandedFull, setIsExpandedFull] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const cliEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && activeTab === "output") {
      logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isOpen, activeTab]);

  const handleCliSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = cliInput.trim();
    if (!cmd) return;

    const newHistory = [...cliHistory, `$ ${cmd}`];

    switch (cmd.toLowerCase()) {
      case "help":
        newHistory.push(
          "Available commands:",
          "  help     - Show list of commands",
          "  clear    - Clear the terminal screen",
          "  node -v  - Display simulated Node.js environment version",
          "  status   - Check project workspace sync status",
          "  date     - Show current server/client time"
        );
        break;
      case "clear":
        setCliHistory([]);
        setCliInput("");
        return;
      case "node -v":
        newHistory.push("v20.12.0 (DevForge Sandboxed Engine)");
        break;
      case "status":
        newHistory.push("Workspace Status: Connected (PostgreSQL Realtime Sync Active)");
        break;
      case "date":
        newHistory.push(new Date().toString());
        break;
      default:
        newHistory.push(`Command not recognized: '${cmd}'. Type 'help' for available commands.`);
    }

    setCliHistory(newHistory);
    setCliInput("");
    setTimeout(() => {
      cliEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  if (!isOpen) {
    return (
      <div className="flex h-8 w-full items-center justify-between border-t bg-muted/40 px-3 select-none text-xs">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-2 font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <TerminalIcon className="size-3.5" />
          <span>Terminal / Console</span>
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
        >
          <ChevronUp className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full flex-col border-t bg-background/95 backdrop-blur transition-all duration-150 select-none",
        isExpandedFull ? "h-80" : "h-48"
      )}
    >
      {/* Terminal Top Tabs */}
      <div className="flex h-8 items-center justify-between border-b bg-muted/40 px-3 text-xs">
        <div className="flex items-center gap-1">
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
        <div className="flex items-center gap-1">
          {activeTab === "output" && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6 text-muted-foreground hover:text-foreground"
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
            className="size-6 text-muted-foreground hover:text-foreground"
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
            className="size-6 text-muted-foreground hover:text-foreground"
            title="Collapse Terminal"
            onClick={onToggle}
          >
            <ChevronDown className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs select-text">
        {activeTab === "output" && (
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
        )}

        {activeTab === "terminal" && (
          <div className="flex h-full flex-col">
            <div className="flex-1 space-y-1">
              {cliHistory.map((line, idx) => (
                <div key={idx} className="whitespace-pre-wrap leading-relaxed text-foreground">
                  {line}
                </div>
              ))}
              <div ref={cliEndRef} />
            </div>

            <form onSubmit={handleCliSubmit} className="mt-2 flex items-center gap-2">
              <span className="text-primary font-bold select-none">&gt;</span>
              <input
                type="text"
                value={cliInput}
                onChange={(e) => setCliInput(e.target.value)}
                placeholder="type a command... (e.g. help, node -v, status)"
                className="flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground/40 text-xs font-mono"
              />
            </form>
          </div>
        )}

        {activeTab === "problems" && (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground select-none">
            <CheckCircle2 className="size-5 mb-1 text-emerald-500" />
            <p>No problems detected in workspace files.</p>
          </div>
        )}
      </div>
    </div>
  );
}
