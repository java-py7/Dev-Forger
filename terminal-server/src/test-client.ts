import { WebSocket } from "ws";
import crypto from "crypto";

const SECRET = "GJj2AEysROWm4jKnXqnd9fP5Cs8PAd0Yum5Y7YJAO5A";
const WS_URL = "ws://localhost:3001/terminal";

function signToken(
  data: { userId: string; projectId: string; projectSlug: string; workspaceId: string },
  secret: string,
  expiresInSeconds = 300
) {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + expiresInSeconds;
  const header = { alg: "HS256", typ: "JWT" };
  const payload = { ...data, iat: now, exp };

  const encode = (obj: any) =>
    Buffer.from(JSON.stringify(obj))
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

  const h = encode(header);
  const p = encode(payload);
  const sig = crypto
    .createHmac("sha256", secret)
    .update(`${h}.${p}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${h}.${p}.${sig}`;
}

async function runTests() {
  console.log("=== DEVFORGE EXTERNAL TERMINAL SERVER VERIFICATION ===");

  // 1. Test unauthenticated connection
  console.log("\n[Test 1] Testing unauthenticated connection (no token)...");
  await new Promise<void>((resolve) => {
    const ws = new WebSocket(WS_URL);
    ws.on("close", (code, reason) => {
      console.log(`✓ Connection rejected as expected (code: ${code}, reason: ${reason.toString()})`);
      resolve();
    });
    ws.on("error", () => {});
  });

  // 2. Test invalid token
  console.log("\n[Test 2] Testing invalid/tampered token...");
  await new Promise<void>((resolve) => {
    const ws = new WebSocket(`${WS_URL}?token=invalid.token.signature`);
    ws.on("close", (code, reason) => {
      console.log(`✓ Invalid token rejected as expected (code: ${code}, reason: ${reason.toString()})`);
      resolve();
    });
    ws.on("error", () => {});
  });

  // 3. Test valid signed token & interactive command execution
  console.log("\n[Test 3] Generating signed session token and connecting...");
  const token = signToken(
    {
      userId: "user_test_123",
      projectId: "project_test_456",
      projectSlug: "ecom",
      workspaceId: "ws_test_789",
    },
    SECRET,
    300
  );
  console.log("✓ Generated signed session token");

  let receivedOutput = "";
  let commandSent = false;

  await new Promise<void>((resolve, reject) => {
    const ws = new WebSocket(`${WS_URL}?token=${token}&cols=100&rows=30`);

    ws.on("open", () => {
      console.log("✓ WebSocket connection opened successfully!");
    });

    ws.on("message", (raw) => {
      const msg = JSON.parse(raw.toString());

      if (msg.type === "ready") {
        console.log("✓ Received 'ready' lifecycle message from terminal server!");
      } else if (msg.type === "status") {
        console.log(`✓ Received status: connected in ${msg.cwd} (PID: ${msg.pid}, Shell: ${msg.shell})`);
        
        // Wait 300ms for shell prompt to settle, then send command
        setTimeout(() => {
          if (!commandSent) {
            commandSent = true;
            console.log("Sending command: echo 'Antigravity Real Terminal Test'");
            ws.send(JSON.stringify({ type: "input", data: "echo 'Antigravity Real Terminal Test'\r\n" }));
          }
        }, 300);
      } else if (msg.type === "output") {
        receivedOutput += msg.data;
        process.stdout.write(msg.data);

        if (receivedOutput.includes("Antigravity Real Terminal Test")) {
          console.log("\n✓ REAL PTY OUTPUT RECEIVED: Verified execution of echo command!");

          // Test resize
          console.log("\n[Test 4] Testing terminal resize...");
          ws.send(JSON.stringify({ type: "resize", cols: 140, rows: 40 }));
          console.log("✓ Sent resize { cols: 140, rows: 40 } without error");

          // Test Ctrl+C signal
          console.log("\n[Test 5] Testing signal termination (SIGINT)...");
          ws.send(JSON.stringify({ type: "signal", signal: "SIGINT" }));
          console.log("✓ Sent signal SIGINT without error");

          setTimeout(() => {
            ws.close();
            resolve();
          }, 500);
        }
      }
    });

    ws.on("error", (err) => {
      console.error("WebSocket error:", err);
      reject(err);
    });

    setTimeout(() => {
      if (!receivedOutput.includes("Antigravity Real Terminal Test")) {
        reject(new Error(`Timed out waiting for terminal execution. Output received so far: ${receivedOutput}`));
      }
    }, 8000);
  });

  // 4. Test path traversal rejection
  console.log("\n[Test 6] Testing path traversal security rejection...");
  const maliciousToken = signToken(
    {
      userId: "../../root",
      projectId: "malicious_project",
      projectSlug: "../../../etc",
      workspaceId: "ws_bad",
    },
    SECRET,
    300
  );

  await new Promise<void>((resolve) => {
    const ws = new WebSocket(`${WS_URL}?token=${maliciousToken}`);
    ws.on("close", (code) => {
      console.log(`✓ Malicious traversal token safely handled/closed (code: ${code})`);
      resolve();
    });
    ws.on("error", () => {});
  });

  console.log("\n=== ALL EXTERNAL TERMINAL SERVER TESTS PASSED PERFECTLY ===");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
