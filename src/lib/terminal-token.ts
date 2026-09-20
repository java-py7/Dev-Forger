import crypto from "crypto";

export interface TerminalTokenPayload {
  userId: string;
  projectId: string;
  projectSlug: string;
  workspaceId: string;
  iat: number;
  exp: number;
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str, "utf8")
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf8");
}

/**
 * Creates a signed JWT using HMAC-SHA256 with the provided secret.
 */
export function signTerminalToken(
  data: {
    userId: string;
    projectId: string;
    projectSlug: string;
    workspaceId: string;
  },
  secret: string,
  expiresInSeconds: number = 300
): { token: string; expiresAt: string } {
  if (!secret) {
    throw new Error("TERMINAL_AUTH_SECRET is required to sign terminal tokens");
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = now + expiresInSeconds;

  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const payload: TerminalTokenPayload = {
    ...data,
    iat: now,
    exp,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const token = `${encodedHeader}.${encodedPayload}.${signature}`;
  const expiresAt = new Date(exp * 1000).toISOString();

  return { token, expiresAt };
}

/**
 * Verifies an HMAC-SHA256 signed terminal token.
 */
export function verifyTerminalToken(
  token: string,
  secret: string
): TerminalTokenPayload | null {
  if (!token || !secret) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;

  // Verify signature
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payloadJson = base64UrlDecode(encodedPayload);
    const payload: TerminalTokenPayload = JSON.parse(payloadJson);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}
