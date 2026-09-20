export async function register() {
  // Do NOT run persistent WebSocket / PTY server in Vercel or cloud serverless environments
  if (
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.NETLIFY ||
    process.env.NODE_ENV === "production"
  ) {
    return;
  }

  // In local development, if no external terminal server is configured, start local fallback
  if (process.env.NEXT_RUNTIME === "nodejs" && !process.env.NEXT_PUBLIC_TERMINAL_WS_URL) {
    try {
      const { startTerminalServer } = await import("./server/terminal-server");
      await startTerminalServer();
    } catch (err) {
      console.warn("[Instrumentation] Local development terminal fallback bypassed:", err);
    }
  }
}
