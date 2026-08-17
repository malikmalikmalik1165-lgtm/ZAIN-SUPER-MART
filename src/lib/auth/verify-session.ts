import { cookies } from "next/headers";
import crypto from "crypto";

/**
 * Server-side ZSM session verification for API routes.
 * Returns the authenticated username or null.
 */
export async function verifyZsmSession(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("zsm_session")?.value;
    if (!token) return null;

    const dotIndex = token.lastIndexOf(".");
    if (dotIndex === -1) return null;

    const payloadB64url = token.substring(0, dotIndex);
    const signature = token.substring(dotIndex + 1);
    if (!payloadB64url || !signature) return null;

    const secret = process.env.ZSM_SESSION_SECRET || "fallback-dev-secret";
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(payloadB64url)
      .digest("hex");

    if (signature !== expectedSig) return null;

    // Decode base64url
    let b64 = payloadB64url.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4 !== 0) b64 += "=";
    const payload = Buffer.from(b64, "base64").toString();
    const data = JSON.parse(payload);

    if (data.exp && data.exp < Date.now()) return null;

    return data.username || null;
  } catch {
    return null;
  }
}
