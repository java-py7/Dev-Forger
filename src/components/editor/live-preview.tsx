"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  RotateCw,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Monitor,
  Tablet,
  Smartphone,
  X,
  Globe,
  Server,
  AlertTriangle,
  Info,
  ChevronDown,
  Terminal,
  Maximize2,
  Minimize2,
  Sparkles,
  Loader2,
  FileCode2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface PreviewConsoleLog {
  id: string;
  level: "log" | "info" | "warn" | "error" | "debug";
  text: string;
  timestamp: string;
}

export type ViewportMode = "desktop" | "tablet" | "mobile";

interface LivePreviewProps {
  projectSlug: string;
  workspaceId: string;
  projectName?: string;
  initialPath?: string;
  detectedServers?: Array<{ port: number; url: string; label?: string }>;
  reloadTrigger?: number;
  onClose?: () => void;
  canEdit?: boolean;
  onFileCreated?: (file: any) => void;
  onSelectFile?: (file: any) => void;
}

export function LivePreview({
  projectSlug,
  workspaceId,
  projectName = "DevForge",
  initialPath = "index.html",
  detectedServers = [],
  reloadTrigger = 0,
  onClose,
  canEdit = true,
  onFileCreated,
  onSelectFile,
}: LivePreviewProps) {
  // Mode: "workspace" (static preview via API) or "server" (local dev server e.g. localhost:3000)
  const [mode, setMode] = useState<"workspace" | "server">("workspace");

  // Path within workspace mode (e.g. "index.html" or "about.html")
  const [workspacePath, setWorkspacePath] = useState<string>(initialPath || "index.html");

  // Server URL for dev server mode (e.g. "http://localhost:3000" or detected URL)
  const [serverUrl, setServerUrl] = useState<string>(() => {
    return detectedServers[0]?.url || "http://localhost:3000";
  });

  // Display URL in the top address bar
  const [urlInputValue, setUrlInputValue] = useState<string>("");

  // Viewport mode: desktop, tablet (768px), mobile (375px)
  const [viewport, setViewport] = useState<ViewportMode>("desktop");

  // Loading state of iframe
  const [isLoading, setIsLoading] = useState(true);

  // Embedded console drawer state
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<PreviewConsoleLog[]>([]);
  const [consoleFilter, setConsoleFilter] = useState<"all" | "error" | "warn" | "log">("all");

  // Copied URL feedback
  const [isCopied, setIsCopied] = useState(false);

  // Creating starter template state
  const [isCreatingStarter, setIsCreatingStarter] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const consoleBottomRef = useRef<HTMLDivElement>(null);

  // Update server URL when a new dev server is detected and mode is server
  useEffect(() => {
    if (detectedServers.length > 0) {
      const latest = detectedServers[detectedServers.length - 1];
      if (mode === "server" && !serverUrl) {
        setServerUrl(latest.url);
      }
    }
  }, [detectedServers, mode, serverUrl]);

  // Compute the current active iframe source URL
  const activeSrc = useMemo(() => {
    if (mode === "server") {
      let url = serverUrl.trim();
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = `http://${url}`;
      }
      return url;
    }

    // Workspace mode
    const cleanPath = workspacePath.replace(/^\/+/, "");
    return `/api/workspaces/${encodeURIComponent(projectSlug)}/preview/${cleanPath}`;
  }, [mode, serverUrl, workspacePath, projectSlug]);

  // Keep the URL address bar in sync
  useEffect(() => {
    if (mode === "workspace") {
      setUrlInputValue(workspacePath.startsWith("/") ? workspacePath : `/${workspacePath}`);
    } else {
      setUrlInputValue(serverUrl);
    }
  }, [mode, workspacePath, serverUrl]);

  // Listen to postMessage logs and events from the previewed iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== "object") return;

      if (event.data.type === "DEVFORGE_PREVIEW_LOG") {
        const { level, text, timestamp } = event.data;
        setConsoleLogs((prev) => [
          ...prev.slice(-199), // keep last 200 logs
          {
            id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            level: level || "log",
            text: text || "",
            timestamp: timestamp || new Date().toLocaleTimeString(),
          },
        ]);
      } else if (event.data.type === "DEVFORGE_PREVIEW_READY") {
        setIsLoading(false);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Trigger reload when reloadTrigger changes
  useEffect(() => {
    if (reloadTrigger > 0) {
      handleReload();
    }
  }, [reloadTrigger]);

  // Auto-scroll console drawer
  useEffect(() => {
    if (consoleOpen) {
      consoleBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [consoleLogs, consoleOpen]);

  // Reload action: try graceful bridge message first, then fallback to refreshing src
  const handleReload = useCallback(() => {
    setIsLoading(true);
    try {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({ type: "DEVFORGE_RELOAD" }, "*");
      }
    } catch {
      // Cross-origin restriction fallback
    }

    // Fallback refresh
    if (iframeRef.current) {
      const current = iframeRef.current.src;
      iframeRef.current.src = "";
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = current;
        }
      }, 50);
    }
  }, []);

  // Handle address bar submission (Enter key)
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = urlInputValue.trim();
    if (!val) return;

    if (val.startsWith("http://") || val.startsWith("https://") || /^\d{3,5}$/.test(val) || val.includes("localhost")) {
      // Switch to server mode
      setMode("server");
      let full = val;
      if (/^\d{3,5}$/.test(val)) {
        full = `http://localhost:${val}`;
      } else if (!val.startsWith("http://") && !val.startsWith("https://")) {
        full = `http://${val}`;
      }
      setServerUrl(full);
    } else {
      // Workspace path mode
      setMode("workspace");
      const clean = val.replace(/^\/+/, "");
      setWorkspacePath(clean || "index.html");
    }

    setIsLoading(true);
  };

  // Open preview in standalone browser tab
  const handleOpenExternal = () => {
    window.open(activeSrc, "_blank", "noopener,noreferrer");
  };

  // Copy preview URL
  const handleCopyUrl = async () => {
    try {
      const fullUrl =
        mode === "server"
          ? activeSrc
          : `${window.location.origin}${activeSrc}`;
      await navigator.clipboard.writeText(fullUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {}
  };

  // Filtered console logs
  const filteredLogs = useMemo(() => {
    if (consoleFilter === "all") return consoleLogs;
    if (consoleFilter === "error") return consoleLogs.filter((l) => l.level === "error");
    if (consoleFilter === "warn") return consoleLogs.filter((l) => l.level === "warn");
    return consoleLogs.filter((l) => l.level === "log" || l.level === "info");
  }, [consoleLogs, consoleFilter]);

  const errorCount = useMemo(
    () => consoleLogs.filter((l) => l.level === "error").length,
    [consoleLogs]
  );
  const warnCount = useMemo(
    () => consoleLogs.filter((l) => l.level === "warn").length,
    [consoleLogs]
  );

  // Quick Action: Create a starter HTML / CSS / JS website in the workspace
  const handleCreateStarterWebsite = async () => {
    if (isCreatingStarter || !canEdit) return;
    setIsCreatingStarter(true);

    try {
      const starterHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName} - Live Website</title>
  <link rel="stylesheet" href="style.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
</head>
<body>
  <div class="glow-bg"></div>
  <main class="container">
    <header class="hero">
      <div class="badge">🚀 Built with DevForge</div>
      <h1>Welcome to <span class="highlight">${projectName}</span></h1>
      <p class="subtitle">Your full-stack cloud workspace is live. Edit your code in the IDE and watch this preview update automatically in real-time!</p>
      
      <div class="button-group">
        <button id="counter-btn" class="primary-btn">
          Clicked <span id="click-count">0</span> times
        </button>
        <button id="color-btn" class="secondary-btn">
          ✨ Random Theme
        </button>
      </div>
    </header>

    <section class="cards-grid">
      <div class="card">
        <div class="card-icon">⚡</div>
        <h3>Instant Live Reload</h3>
        <p>Changes saved in the editor appear instantly without refreshing your browser.</p>
      </div>
      <div class="card">
        <div class="card-icon">📱</div>
        <h3>Responsive Viewports</h3>
        <p>Switch seamlessly between Desktop, Tablet, and Mobile device testing.</p>
      </div>
      <div class="card">
        <div class="card-icon">🛠️</div>
        <h3>Console Streaming</h3>
        <p>Debug live browser logs and exceptions directly from the built-in drawer.</p>
      </div>
    </section>

    <footer>
      <p>DevForge Cloud IDE • Ready for production</p>
    </footer>
  </main>

  <script src="script.js"></script>
</body>
</html>
`;

      const starterCss = `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  background-color: #0b0f19;
  color: #f8fafc;
  min-height: 100vh;
  overflow-x: hidden;
  position: relative;
  display: flex;
  justify-content: center;
}

.glow-bg {
  position: absolute;
  top: -150px;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, rgba(139, 92, 246, 0.1) 50%, transparent 70%);
  filter: blur(80px);
  pointer-events: none;
}

.container {
  max-width: 800px;
  width: 100%;
  padding: 48px 24px;
  z-index: 1;
}

.hero {
  text-align: center;
  margin-bottom: 48px;
}

.badge {
  display: inline-block;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 9999px;
  margin-bottom: 20px;
}

h1 {
  font-size: clamp(2rem, 5vw, 3.2rem);
  font-weight: 800;
  line-height: 1.15;
  margin-bottom: 16px;
  letter-spacing: -0.02em;
}

.highlight {
  background: linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #c084fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  font-size: 16px;
  color: #94a3b8;
  max-width: 560px;
  margin: 0 auto 28px;
  line-height: 1.6;
}

.button-group {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

button {
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 20px;
  border-radius: 8px;
  transition: all 0.2s ease;
  border: none;
}

.primary-btn {
  background: #38bdf8;
  color: #04131f;
  box-shadow: 0 4px 14px rgba(56, 189, 248, 0.35);
}

.primary-btn:hover {
  background: #7dd3fc;
  transform: translateY(-1px);
}

.secondary-btn {
  background: rgba(255, 255, 255, 0.06);
  color: #f8fafc;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.secondary-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-1px);
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 48px;
}

.card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 24px;
  backdrop-filter: blur(12px);
  transition: transform 0.2s, border-color 0.2s;
}

.card:hover {
  transform: translateY(-2px);
  border-color: rgba(56, 189, 248, 0.3);
}

.card-icon {
  font-size: 24px;
  margin-bottom: 12px;
}

.card h3 {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
  color: #f1f5f9;
}

.card p {
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.5;
}

footer {
  text-align: center;
  font-size: 12px;
  color: #64748b;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding-top: 24px;
}
`;

      const starterJs = `// DevForge Live Frontend Script
console.log("🚀 ${projectName} live website initialized!");

let clicks = 0;
const counterBtn = document.getElementById("counter-btn");
const clickCount = document.getElementById("click-count");
const colorBtn = document.getElementById("color-btn");

if (counterBtn && clickCount) {
  counterBtn.addEventListener("click", () => {
    clicks++;
    clickCount.textContent = clicks;
    console.log(\`Button clicked \${clicks} times.\`);
  });
}

const colors = [
  "#38bdf8", "#818cf8", "#c084fc", "#34d399", "#fbbf24", "#f43f5e"
];

if (colorBtn) {
  colorBtn.addEventListener("click", () => {
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const highlight = document.querySelector(".highlight");
    if (highlight) {
      highlight.style.background = \`linear-gradient(135deg, \${randomColor} 0%, #ffffff 100%)\`;
      highlight.style.webkitBackgroundClip = "text";
    }
    console.log(\`Theme accent changed to: \${randomColor}\`);
  });
}
`;

      const { createFile } = await import(
        "@/app/(dashboard)/projects/[slug]/workspace-actions"
      );

      // Create index.html
      const htmlRes = await createFile({
        workspaceId,
        name: "index.html",
        path: "index.html",
        type: "FILE",
        content: starterHtml,
        language: "html",
      });

      // Create style.css
      await createFile({
        workspaceId,
        name: "style.css",
        path: "style.css",
        type: "FILE",
        content: starterCss,
        language: "css",
      });

      // Create script.js
      await createFile({
        workspaceId,
        name: "script.js",
        path: "script.js",
        type: "FILE",
        content: starterJs,
        language: "javascript",
      });

      if (htmlRes.success && htmlRes.file) {
        onFileCreated?.(htmlRes.file);
        onSelectFile?.(htmlRes.file);
      }

      setMode("workspace");
      setWorkspacePath("index.html");
      handleReload();
    } catch (err) {
      console.error("Failed to create starter website:", err);
    } finally {
      setIsCreatingStarter(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="flex h-full w-full flex-col overflow-hidden bg-[#090d16] text-foreground select-none border-l border-border/40">
        {/* Top Preview Control Bar */}
        <header className="flex h-10 w-full shrink-0 items-center justify-between gap-1.5 border-b border-border/40 bg-card/60 px-2 backdrop-blur">
          {/* Navigation Controls: Back, Forward, Reload */}
          <div className="flex items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Back"
              onClick={() => {
                try {
                  iframeRef.current?.contentWindow?.history.back();
                } catch {}
              }}
            >
              <ArrowLeft className="size-3.5" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Forward"
              onClick={() => {
                try {
                  iframeRef.current?.contentWindow?.history.forward();
                } catch {}
              }}
            >
              <ArrowRight className="size-3.5" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Reload Preview (Ctrl+R)"
              onClick={handleReload}
            >
              <RotateCw className={cn("size-3.5", isLoading && "animate-spin text-primary")} />
            </Button>
          </div>

          {/* Mode Switcher & URL Address Bar */}
          <form onSubmit={handleUrlSubmit} className="flex flex-1 items-center gap-1.5 max-w-xl">
            {/* Mode Selector Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-medium border transition-colors cursor-pointer shrink-0",
                  mode === "workspace"
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                )}
              >
                {mode === "workspace" ? (
                  <>
                    <Globe className="size-3" />
                    <span className="hidden sm:inline">Workspace</span>
                  </>
                ) : (
                  <>
                    <Server className="size-3" />
                    <span className="hidden sm:inline">Dev Server</span>
                  </>
                )}
                <ChevronDown className="size-2.5 opacity-60 ml-0.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52 text-xs">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Preview Source</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => {
                      setMode("workspace");
                      setIsLoading(true);
                    }}
                    className="gap-2 cursor-pointer"
                  >
                    <Globe className="size-3.5 text-primary" />
                    <div>
                      <div className="font-medium">Workspace Static</div>
                      <div className="text-[10px] text-muted-foreground">Preview HTML/CSS/JS files</div>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuLabel>Running Dev Servers</DropdownMenuLabel>
                  {detectedServers.length === 0 ? (
                    <div className="px-2 py-1.5 text-[11px] text-muted-foreground">
                      No active dev server detected. Start one in the terminal (e.g. <code>npm run dev</code>).
                    </div>
                  ) : (
                    detectedServers.map((srv) => (
                      <DropdownMenuItem
                        key={srv.port}
                        onClick={() => {
                          setMode("server");
                          setServerUrl(srv.url);
                          setIsLoading(true);
                        }}
                        className="gap-2 cursor-pointer"
                      >
                        <Server className="size-3.5 text-emerald-400" />
                        <div>
                          <div className="font-medium">Port {srv.port}</div>
                          <div className="text-[10px] text-muted-foreground">{srv.url}</div>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}

                  <DropdownMenuItem
                    onClick={() => {
                      setMode("server");
                      setServerUrl("http://localhost:3000");
                      setIsLoading(true);
                    }}
                    className="gap-2 cursor-pointer"
                  >
                    <Server className="size-3.5 text-muted-foreground" />
                    <span>Custom Port (localhost:3000)</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Address bar input */}
            <div className="relative flex-1">
              <Input
                value={urlInputValue}
                onChange={(e) => setUrlInputValue(e.target.value)}
                placeholder={mode === "workspace" ? "/index.html" : "http://localhost:3000"}
                className="h-7 text-xs font-mono bg-background/60 border-border/40 pl-2.5 pr-6 focus-visible:ring-1 focus-visible:ring-primary"
              />
              {isLoading && (
                <Loader2 className="absolute right-2 top-1.5 size-3.5 animate-spin text-primary pointer-events-none" />
              )}
            </div>
          </form>

          {/* Right Tools: Viewport Presets, Console Toggle, Popout, Close */}
          <div className="flex items-center gap-1">
            {/* Viewport Switcher */}
            <div className="hidden sm:flex items-center rounded-md border border-border/40 bg-background/50 p-0.5">
              <Tooltip>
                <TooltipTrigger
                  onClick={() => setViewport("desktop")}
                  className={cn(
                    "size-6 flex items-center justify-center rounded cursor-pointer transition-colors",
                    viewport === "desktop"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Monitor className="size-3" />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Desktop (100%)
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger
                  onClick={() => setViewport("tablet")}
                  className={cn(
                    "size-6 flex items-center justify-center rounded cursor-pointer transition-colors",
                    viewport === "tablet"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Tablet className="size-3" />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Tablet (768px)
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger
                  onClick={() => setViewport("mobile")}
                  className={cn(
                    "size-6 flex items-center justify-center rounded cursor-pointer transition-colors",
                    viewport === "mobile"
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Smartphone className="size-3" />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Mobile (375px)
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Console Drawer Toggle */}
            <Tooltip>
              <TooltipTrigger
                onClick={() => setConsoleOpen(!consoleOpen)}
                className={cn(
                  "size-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground cursor-pointer relative hover:bg-muted",
                  consoleOpen && "bg-secondary text-foreground"
                )}
              >
                <Terminal className="size-3.5" />
                {errorCount > 0 && (
                  <span className="absolute -top-1 -right-1 size-3.5 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center">
                    {errorCount}
                  </span>
                )}
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Toggle Preview Console
              </TooltipContent>
            </Tooltip>

            {/* Copy URL */}
            <Tooltip>
              <TooltipTrigger
                onClick={handleCopyUrl}
                className="size-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground cursor-pointer hover:bg-muted"
              >
                {isCopied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {isCopied ? "Copied!" : "Copy Preview URL"}
              </TooltipContent>
            </Tooltip>

            {/* Open in New Window */}
            <Tooltip>
              <TooltipTrigger
                onClick={handleOpenExternal}
                className="size-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground cursor-pointer hover:bg-muted"
              >
                <ExternalLink className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Open in New Tab
              </TooltipContent>
            </Tooltip>

            {/* Close Preview */}
            {onClose && (
              <Tooltip>
                <TooltipTrigger
                  onClick={onClose}
                  className="size-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground cursor-pointer hover:bg-muted ml-0.5"
                >
                  <X className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Close Preview
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </header>

        {/* Viewport Badge Indicator (Tablet/Mobile) */}
        {viewport !== "desktop" && (
          <div className="flex h-5 items-center justify-center border-b border-border/20 bg-muted/20 text-[10px] text-muted-foreground">
            {viewport === "tablet" ? "Tablet Viewport (768 × 1024)" : "Mobile Viewport (375 × 667)"}
          </div>
        )}

        {/* Main Preview Frame Container */}
        <div className="flex flex-1 items-center justify-center overflow-auto bg-[#070a12] p-0 relative">
          <div
            className={cn(
              "h-full transition-all duration-200 relative flex flex-col bg-background shadow-2xl",
              viewport === "desktop" && "w-full",
              viewport === "tablet" && "w-[768px] my-3 rounded-xl border border-border/40 overflow-hidden shadow-cyan-950/20",
              viewport === "mobile" && "w-[375px] my-3 rounded-2xl border-2 border-border/60 overflow-hidden shadow-cyan-950/30"
            )}
          >
            {/* Sandboxed Live Preview Iframe */}
            <iframe
              ref={iframeRef}
              src={activeSrc}
              title="DevForge Website Live Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
              className="h-full w-full border-0 bg-white"
              onLoad={() => setIsLoading(false)}
            />
          </div>
        </div>

        {/* Embedded Console Drawer */}
        {consoleOpen && (
          <div className="h-44 shrink-0 border-t border-border/40 bg-[#080b11] flex flex-col select-text font-mono text-xs">
            {/* Console Toolbar */}
            <div className="flex h-7 items-center justify-between border-b border-border/30 bg-muted/30 px-3 select-none text-[11px]">
              <div className="flex items-center gap-1.5 font-sans">
                <Terminal className="size-3 text-primary" />
                <span className="font-semibold text-foreground">Preview Console</span>

                <div className="flex items-center gap-1 ml-2">
                  <button
                    type="button"
                    onClick={() => setConsoleFilter("all")}
                    className={cn(
                      "px-1.5 py-0.5 rounded cursor-pointer transition-colors text-[10px]",
                      consoleFilter === "all" ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    All ({consoleLogs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setConsoleFilter("error")}
                    className={cn(
                      "px-1.5 py-0.5 rounded cursor-pointer transition-colors text-[10px]",
                      consoleFilter === "error" ? "bg-destructive/20 text-destructive font-medium" : "text-muted-foreground hover:text-destructive"
                    )}
                  >
                    Errors ({errorCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setConsoleFilter("warn")}
                    className={cn(
                      "px-1.5 py-0.5 rounded cursor-pointer transition-colors text-[10px]",
                      consoleFilter === "warn" ? "bg-amber-500/20 text-amber-500 font-medium" : "text-muted-foreground hover:text-amber-500"
                    )}
                  >
                    Warnings ({warnCount})
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1 select-none font-sans">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
                  onClick={() => setConsoleLogs([])}
                >
                  Clear
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-5 text-muted-foreground hover:text-foreground cursor-pointer"
                  onClick={() => setConsoleOpen(false)}
                >
                  <X className="size-3" />
                </Button>
              </div>
            </div>

            {/* Console Log Stream */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
              {filteredLogs.length === 0 ? (
                <div className="flex items-center justify-center py-6 text-muted-foreground/50 select-none text-xs font-sans">
                  No console logs captured yet from preview.
                </div>
              ) : (
                filteredLogs.map((log) => {
                  let color = "text-foreground";
                  if (log.level === "error") color = "text-destructive font-medium";
                  if (log.level === "warn") color = "text-amber-400 font-medium";
                  if (log.level === "info") color = "text-sky-400";

                  return (
                    <div key={log.id} className={cn("flex items-start gap-2 leading-relaxed text-[11px]", color)}>
                      <span className="shrink-0 text-muted-foreground/40 text-[10px] select-none">
                        {log.timestamp}
                      </span>
                      <span className="whitespace-pre-wrap break-all">{log.text}</span>
                    </div>
                  );
                })
              )}
              <div ref={consoleBottomRef} />
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
