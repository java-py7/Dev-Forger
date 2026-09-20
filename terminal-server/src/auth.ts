import crypto from "crypto";

export interface TerminalTokenPayload {
  userId: string;
  projectId: string;
  projectSlug: string;
  workspaceId: string;
  iat: number;
  exp: number;
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf8");
}

/**
 * Validates the HMAC-SHA256 signature and expiration of an incoming terminal token.
 */
export function verifyTerminalToken(
  token: string,
  secret: string
): TerminalTokenPayload | null {
  if (!token || !secret) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [encodedHeader, encodedPayload, signature] = parts;

  // Re-compute expected signature
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payloadJson = base64UrlDecode(encodedPayload);
    const payload: TerminalTokenPayload = JSON.parse(payloadJson);

    // Validate required fields
    if (
      !payload.userId ||
      !payload.projectId ||
      !payload.projectSlug ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }

    // Check expiration (Unix seconds)
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      console.warn(`[Terminal Auth] Token expired for user ${payload.userId} (exp: ${payload.exp}, now: ${now})`);
      return null;
    }

    return payload;
  } catch (err) {
    console.warn("[Terminal Auth] Failed to parse token payload:", err);
    return null;
  }
}
