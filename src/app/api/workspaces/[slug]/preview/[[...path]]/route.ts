import { NextRequest } from "next/server";
import path from "path";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

function getFriendlyNotFoundHtml(projectSlug: string, requestedFile: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Live Preview - ${projectSlug}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #080b11;
      color: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
    }
    .card {
      max-width: 480px;
      width: 100%;
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 12px;
      padding: 32px;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: rgba(56, 189, 248, 0.1);
      color: #38bdf8;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }
    h2 { font-size: 18px; font-weight: 600; margin-bottom: 8px; color: #f8fafc; }
    p { font-size: 13px; color: #94a3b8; line-height: 1.5; margin-bottom: 20px; }
    .code-box {
      background: #020617;
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 12px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      color: #38bdf8;
      text-align: left;
      margin-bottom: 20px;
      overflow-x: auto;
    }
    .btn {
      display: inline-block;
      background: #0284c7;
      color: #fff;
      font-size: 13px;
      font-weight: 500;
      padding: 8px 16px;
      border-radius: 6px;
      text-decoration: none;
      cursor: pointer;
      border: none;
      transition: background 0.2s;
    }
    .btn:hover { background: #0369a1; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    </div>
    <h2>No HTML file ready to preview</h2>
    <p>Live Preview serves HTML, CSS, and web assets from your project workspace. Create an <code>index.html</code> file in your workspace to render here.</p>
    <div class="code-box">
&lt;!DOCTYPE html&gt;
&lt;html&gt;
  &lt;body&gt;
    &lt;h1&gt;Hello DevForge!&lt;/h1&gt;
  &lt;/body&gt;
&lt;/html&gt;
    </div>
    <button class="btn" onclick="window.location.reload()">Refresh Preview</button>
  </div>
  ${INJECTED_BRIDGE_SCRIPT}
</body>
</html>`;
}

type Props = {
  params: Promise<{
    slug: string;
    path?: string[];
  }>;
};

export async function GET(req: NextRequest, { params }: Props) {
  const { slug, path: pathSegments } = await params;

  // Query project and files from database
  const project = await prisma.project.findUnique({
    where: { slug },
    include: {
      members: {
        select: { userId: true },
      },
      workspace: {
        include: {
          files: {
            select: {
              id: true,
              name: true,
              path: true,
              type: true,
              content: true,
            },
          },
        },
      },
    },
  });

  if (!project) {
    return new Response(`Project not found: ${slug}`, { status: 404 });
  }

  // Check access permissions for private projects
  if (project.visibility !== "PUBLIC") {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response("Unauthorized: Please sign in to view private preview", {
        status: 401,
      });
    }

    const userId = session.user.id;
    const isOwner = project.ownerId === userId;
    const isMember = project.members.some((m) => m.userId === userId);

    if (!isOwner && !isMember) {
      return new Response("Forbidden: Access denied to private preview", { status: 403 });
    }
  }

  // Resolve target file path
  const relativeSegments = Array.isArray(pathSegments) ? pathSegments : [];
  let relativeFilePath = relativeSegments.join("/");

  // If root preview is requested, default to index.html
  if (!relativeFilePath || relativeFilePath.trim() === "") {
    relativeFilePath = "index.html";
  }

  const cleanTarget = relativeFilePath.replace(/\\/g, "/").replace(/^\/+/, "");
  const workspaceFiles = project.workspace?.files || [];

  // 1. Direct match in database workspace files
  let targetFile = workspaceFiles.find(
    (f) => f.path.replace(/\\/g, "/").toLowerCase() === cleanTarget.toLowerCase()
  );

  // 2. If not found and no extension, try matching with .html extension
  if (!targetFile && !path.extname(cleanTarget)) {
    targetFile = workspaceFiles.find(
      (f) => f.path.replace(/\\/g, "/").toLowerCase() === `${cleanTarget}.html`.toLowerCase()
    );
  }

  // 3. If index.html was requested but not found, try ANY .html file in the workspace
  if (!targetFile && (cleanTarget === "index.html" || cleanTarget === "")) {
    targetFile = workspaceFiles.find((f) => f.path.toLowerCase().endsWith(".html"));
  }

  // If found in database, serve content directly
  if (targetFile && targetFile.content !== null) {
    let content = targetFile.content;
    const ext = path.extname(targetFile.path).toLowerCase();
    const contentType = MIME_TYPES[ext] || "text/plain; charset=utf-8";

    if (ext === ".html" || ext === ".htm") {
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
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  // 4. In local development only: check local disk if available
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    try {
      const fs = await import("fs");
      const diskDir = path.resolve(process.cwd(), "workspaces", slug);

      if (fs.existsSync(/*turbopackIgnore: true*/ diskDir)) {
        let diskPath = path.resolve(diskDir, cleanTarget);
        if (
          diskPath.startsWith(diskDir) &&
          fs.existsSync(/*turbopackIgnore: true*/ diskPath)
        ) {
          if (fs.statSync(/*turbopackIgnore: true*/ diskPath).isDirectory()) {
            diskPath = path.join(diskPath, "index.html");
          }

          if (fs.existsSync(/*turbopackIgnore: true*/ diskPath)) {
            const ext = path.extname(diskPath).toLowerCase();
            const contentType = MIME_TYPES[ext] || "application/octet-stream";

            if (ext === ".html" || ext === ".htm") {
              let html = fs.readFileSync(/*turbopackIgnore: true*/ diskPath, "utf8");
              if (html.includes("</body>")) {
                html = html.replace("</body>", `${INJECTED_BRIDGE_SCRIPT}\n</body>`);
              } else {
                html = `${html}\n${INJECTED_BRIDGE_SCRIPT}`;
              }
              return new Response(html, {
                status: 200,
                headers: {
                  "Content-Type": contentType,
                  "Cache-Control": "no-cache, no-store, must-revalidate",
                  "Access-Control-Allow-Origin": "*",
                },
              });
            }

            const buf = fs.readFileSync(/*turbopackIgnore: true*/ diskPath);
            return new Response(buf, {
              status: 200,
              headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=60",
                "Access-Control-Allow-Origin": "*",
              },
            });
          }
        }
      }
    } catch {}
  }

  // 5. If requesting HTML or root and nothing matched, serve friendly placeholder
  const requestedExt = path.extname(cleanTarget).toLowerCase();
  if (!requestedExt || requestedExt === ".html" || requestedExt === ".htm") {
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
