import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getProjectWorkspaceDir, WORKSPACES_ROOT } from "@/server/workspace-manager";

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".cjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".wasm": "application/wasm",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
};

const INJECTED_BRIDGE_SCRIPT = `
<script data-devforge-preview="true">
(function() {
  // 1. Intercept console calls and post to parent IDE
  var levels = ['log', 'info', 'warn', 'error', 'debug'];
  levels.forEach(function(lvl) {
    var orig = console[lvl] ? console[lvl].bind(console) : console.log.bind(console);
    console[lvl] = function() {
      var args = Array.prototype.slice.call(arguments);
      try {
        var formatted = args.map(function(item) {
          if (typeof item === 'object' && item !== null) {
            try { return JSON.stringify(item, null, 2); } catch(e) { return String(item); }
          }
          return String(item);
        }).join(' ');

        if (window.parent && window.parent !== window) {
          window.parent.postMessage({
            type: 'DEVFORGE_PREVIEW_LOG',
            level: lvl,
            text: formatted,
            timestamp: new Date().toLocaleTimeString()
          }, '*');
        }
      } catch(err) {}
      orig.apply(console, args);
    };
  });

  // 2. Intercept uncaught runtime exceptions
  window.addEventListener('error', function(event) {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'DEVFORGE_PREVIEW_LOG',
          level: 'error',
          text: (event.message || 'Uncaught exception') + (event.filename ? ' (' + event.filename + ':' + event.lineno + ')' : ''),
          timestamp: new Date().toLocaleTimeString()
        }, '*');
      }
    } catch(err) {}
  });

  // 3. Listen for parent reload notifications
  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'DEVFORGE_RELOAD') {
      window.location.reload();
    }
  });

  // 4. Notify parent that preview is loaded and forward current path
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({
      type: 'DEVFORGE_PREVIEW_READY',
      pathname: window.location.pathname,
      title: document.title || 'Live Preview'
    }, '*');
  }
})();
</script>
`;

function getFriendlyNotFoundHtml(slug: string, attemptedPath: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DevForge Live Preview - ${slug}</title>
  ${INJECTED_BRIDGE_SCRIPT}
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #090d16;
      color: #f1f5f9;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 24px;
      box-sizing: border-box;
      text-align: center;
    }
    .card {
      background: rgba(30, 41, 59, 0.55);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 16px;
      padding: 32px 28px;
      max-width: 480px;
      backdrop-filter: blur(14px);
      box-shadow: 0 20px 30px -5px rgba(0, 0, 0, 0.6);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(56, 189, 248, 0.12);
      color: #38bdf8;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 9999px;
      margin-bottom: 16px;
      border: 1px solid rgba(56, 189, 248, 0.25);
    }
    h1 {
      font-size: 20px;
      font-weight: 700;
      margin: 0 0 10px;
      color: #ffffff;
    }
    p {
      font-size: 13px;
      line-height: 1.6;
      color: #94a3b8;
      margin: 0 0 16px;
    }
    code {
      background: #0f172a;
      color: #38bdf8;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
    }
    .btn {
      background: #38bdf8;
      color: #04131f;
      font-weight: 700;
      font-size: 13px;
      padding: 10px 20px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(56, 189, 248, 0.35);
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn:hover {
      background: #7dd3fc;
      transform: translateY(-1px);
    }
    .hint {
      font-size: 11px;
      color: #64748b;
      margin-top: 18px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 14px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">🌐 DevForge Live Preview</div>
    <h1>Ready for Live Preview</h1>
    <p>No <code>${attemptedPath || "index.html"}</code> file was detected in <code>${slug}</code> yet.</p>
    <p>Click below to generate a modern starter website template directly in your workspace:</p>
    <div>
      <button
        type="button"
        class="btn"
        onclick="if(window.parent && window.parent !== window){window.parent.postMessage({type:'DEVFORGE_CREATE_STARTER'},'*');}"
      >
        ✨ Generate Starter Website (HTML, CSS, JS)
      </button>
    </div>
    <div class="hint">
      Tip: For backend/Node/Python scripts, use the <strong>Run</strong> button above to view output in the Console.
    </div>
  </div>
</body>
</html>`;
}

type RouteContext = {
  params: Promise<{
    slug: string;
    path?: string[];
  }>;
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { slug, path: pathSegments } = await params;

  if (!slug) {
    return new Response("Missing project slug", { status: 400 });
  }

  // Find project in database
  const project = await prisma.project.findUnique({
    where: { slug },
    include: {
      members: true,
    },
  });

  if (!project) {
    return new Response("Project not found", { status: 404 });
  }

  // Check authorization if project is private
  if (project.visibility === "PRIVATE") {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response("Unauthorized to view private project preview", { status: 401 });
    }

    const userId = session.user.id;
    const isOwner = project.ownerId === userId;
    const isMember = project.members.some((m) => m.userId === userId);

    if (!isOwner && !isMember) {
      return new Response("Forbidden: Access denied to private preview", { status: 403 });
    }
  }

  // Resolve directory on disk (safely)
  let workspaceDir = "";
  try {
    workspaceDir = getProjectWorkspaceDir(slug);
    if (!fs.existsSync(workspaceDir)) {
      fs.mkdirSync(workspaceDir, { recursive: true });
    }
  } catch {
    workspaceDir = "";
  }

  // Resolve target file path
  const relativeSegments = Array.isArray(pathSegments) ? pathSegments : [];
  let relativeFilePath = relativeSegments.join("/");

  // If root preview is requested, default to index.html
  if (!relativeFilePath || relativeFilePath.trim() === "") {
    relativeFilePath = "index.html";
  }

  let finalPath = "";
  if (workspaceDir) {
    const resolvedTarget = path.resolve(workspaceDir, relativeFilePath);
    if (resolvedTarget.startsWith(workspaceDir)) {
      finalPath = resolvedTarget;
    }
  }

  // If path is a directory, look for index.html inside
  if (finalPath && fs.existsSync(finalPath) && fs.statSync(finalPath).isDirectory()) {
    finalPath = path.join(finalPath, "index.html");
  }

  // If file does not exist directly on disk, try adding .html extension
  if (finalPath && !fs.existsSync(finalPath)) {
    if (fs.existsSync(finalPath + ".html")) {
      finalPath = finalPath + ".html";
    }
  }

  // If still not found on disk, check database fallback
  if (!finalPath || !fs.existsSync(finalPath) || fs.statSync(finalPath).isDirectory()) {
    try {
      const dbFile = await prisma.workspaceFile.findFirst({
        where: {
          workspace: { projectId: project.id },
          path: relativeFilePath,
        },
      });

      if (dbFile && dbFile.content !== null) {
        let content = dbFile.content;
        const fileExt = path.extname(relativeFilePath).toLowerCase();
        const contentType = MIME_TYPES[fileExt] || "text/plain; charset=utf-8";

        if (fileExt === ".html" || fileExt === ".htm") {
          if (content.includes("</body>")) {
            content = content.replace("</body>", `${INJECTED_BRIDGE_SCRIPT}\n</body>`);
          } else if (content.includes("</html>")) {
            content = content.replace("</html>", `${INJECTED_BRIDGE_SCRIPT}\n</html>`);
          } else {
            content = `${content}\n${INJECTED_BRIDGE_SCRIPT}`;
          }
        }

        return new Response(content, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        });
      }

      // If index.html was requested but not found, check if ANY HTML file exists in the workspace
      if (relativeFilePath === "index.html") {
        const anyHtmlFile = await prisma.workspaceFile.findFirst({
          where: {
            workspace: { projectId: project.id },
            type: "FILE",
            path: { endsWith: ".html" },
          },
        });

        if (anyHtmlFile && anyHtmlFile.content !== null) {
          let content = anyHtmlFile.content;
          if (content.includes("</body>")) {
            content = content.replace("</body>", `${INJECTED_BRIDGE_SCRIPT}\n</body>`);
          } else if (content.includes("</html>")) {
            content = content.replace("</html>", `${INJECTED_BRIDGE_SCRIPT}\n</html>`);
          } else {
            content = `${content}\n${INJECTED_BRIDGE_SCRIPT}`;
          }

          return new Response(content, {
            status: 200,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "no-cache, no-store, must-revalidate",
            },
          });
        }
      }
    } catch (err) {
      console.warn("[Workspace Preview API] DB lookup error:", err);
    }

    // If requesting HTML or root, serve friendly placeholder with status 200 to prevent console 404s
    const ext = path.extname(relativeFilePath).toLowerCase();
    if (!ext || ext === ".html" || ext === ".htm") {
      const notFoundHtml = getFriendlyNotFoundHtml(slug, relativeFilePath);
      return new Response(notFoundHtml, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    return new Response(`File not found: ${relativeFilePath}`, { status: 404 });
  }

  const ext = path.extname(finalPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  try {
    // Handle HTML files: inject bridge script
    if (ext === ".html" || ext === ".htm") {
      let htmlContent = fs.readFileSync(finalPath, "utf8");

      if (htmlContent.includes("</body>")) {
        htmlContent = htmlContent.replace("</body>", `${INJECTED_BRIDGE_SCRIPT}\n</body>`);
      } else if (htmlContent.includes("</html>")) {
        htmlContent = htmlContent.replace("</html>", `${INJECTED_BRIDGE_SCRIPT}\n</html>`);
      } else {
        htmlContent = `${htmlContent}\n${INJECTED_BRIDGE_SCRIPT}`;
      }

      return new Response(htmlContent, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Binary / other static files
    const fileBuffer = fs.readFileSync(finalPath);
    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=60",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    console.error("[Workspace Preview API] Error serving file:", err);
    return new Response(`Server error serving file: ${err.message}`, { status: 500 });
  }
}
