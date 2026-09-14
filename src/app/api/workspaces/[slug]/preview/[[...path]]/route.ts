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
  <title>DevForge Live Preview - Not Found</title>
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
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 32px;
      max-width: 480px;
      backdrop-filter: blur(12px);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(56, 189, 248, 0.1);
      color: #38bdf8;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 9999px;
      margin-bottom: 16px;
      border: 1px solid rgba(56, 189, 248, 0.2);
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      margin: 0 0 12px;
      color: #ffffff;
    }
    p {
      font-size: 14px;
      line-height: 1.6;
      color: #94a3b8;
      margin: 0 0 20px;
    }
    code {
      background: #0f172a;
      color: #38bdf8;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 13px;
    }
    .hint {
      font-size: 12px;
      color: #64748b;
      margin-top: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      padding-top: 16px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">🌐 DevForge Live Preview</div>
    <h1>No HTML file found</h1>
    <p>We could not find <code>${attemptedPath || "index.html"}</code> in project <code>${slug}</code>.</p>
    <p>Create an <code>index.html</code> file in your project workspace to start seeing live updates as you code!</p>
    <div class="hint">
      Tip: Click "Run" or save your file to refresh the preview automatically.
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

  // Resolve directory on disk
  let workspaceDir = "";
  try {
    workspaceDir = getProjectWorkspaceDir(slug);
  } catch {
    return new Response("Invalid workspace directory", { status: 400 });
  }

  if (!fs.existsSync(workspaceDir)) {
    return new Response("Workspace directory does not exist on disk", { status: 404 });
  }

  // Resolve target file path
  const relativeSegments = Array.isArray(pathSegments) ? pathSegments : [];
  let relativeFilePath = relativeSegments.join("/");

  // If root preview is requested, default to index.html
  if (!relativeFilePath || relativeFilePath.trim() === "") {
    relativeFilePath = "index.html";
  }

  // Prevent path traversal
  const resolvedTarget = path.resolve(workspaceDir, relativeFilePath);
  if (!resolvedTarget.startsWith(workspaceDir)) {
    return new Response("Access denied: Directory traversal detected", { status: 403 });
  }

  let finalPath = resolvedTarget;

  // If path is a directory, look for index.html inside
  if (fs.existsSync(finalPath) && fs.statSync(finalPath).isDirectory()) {
    finalPath = path.join(finalPath, "index.html");
  }

  // If file does not exist directly, try adding .html extension
  if (!fs.existsSync(finalPath)) {
    if (fs.existsSync(finalPath + ".html")) {
      finalPath = finalPath + ".html";
    }
  }

  // If still not found
  if (!fs.existsSync(finalPath) || fs.statSync(finalPath).isDirectory()) {
    // If requesting HTML or root, serve friendly placeholder
    const ext = path.extname(relativeFilePath).toLowerCase();
    if (!ext || ext === ".html" || ext === ".htm") {
      const notFoundHtml = getFriendlyNotFoundHtml(slug, relativeFilePath);
      return new Response(notFoundHtml, {
        status: 404,
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
