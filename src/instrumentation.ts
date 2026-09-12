export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { startTerminalServer } = await import("./server/terminal-server");
      await startTerminalServer();
    } catch (err) {
      console.error("[Instrumentation] Failed to auto-start terminal server:", err);
    }
  }
}
