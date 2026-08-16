import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function fromBase64url(str: string): string {
  let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4 !== 0) b64 += "=";
  return Buffer.from(b64, "base64").toString();
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("zsm_session")?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false });
    }

    const dotIndex = token.lastIndexOf(".");
    if (dotIndex === -1) {
      return NextResponse.json({ authenticated: false });
    }

    const payloadB64url = token.substring(0, dotIndex);
    const signature = token.substring(dotIndex + 1);

    const secret = process.env.ZSM_SESSION_SECRET || "fallback-dev-secret";
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(payloadB64url)
      .digest("hex");

    if (signature !== expectedSig) {
      return NextResponse.json({ authenticated: false });
    }

    const payload = fromBase64url(payloadB64url);
    const data = JSON.parse(payload);

    if (data.exp && data.exp < Date.now()) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({
      authenticated: true,
      user: { username: data.username, role: "admin" },
    });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
