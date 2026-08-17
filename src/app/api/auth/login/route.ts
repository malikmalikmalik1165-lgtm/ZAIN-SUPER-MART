import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const SESSION_COOKIE = "zsm_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Use base64url (no padding, URL-safe characters)
function toBase64url(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function createSessionToken(username: string): string {
  const secret = process.env.ZSM_SESSION_SECRET || "fallback-dev-secret";
  const payload = JSON.stringify({
    username,
    iat: Date.now(),
    exp: Date.now() + SESSION_MAX_AGE * 1000,
  });
  const payloadB64 = toBase64url(payload);
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payloadB64)
    .digest("hex");
  return payloadB64 + "." + signature;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const adminUsername = process.env.ZSM_ADMIN_USERNAME;
    const adminPassword = process.env.ZSM_ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      return NextResponse.json(
        { error: "Authentication is not configured" },
        { status: 500 }
      );
    }

    // Constant-time comparison
    const usernameMatch =
      username.length === adminUsername.length &&
      crypto.timingSafeEqual(Buffer.from(username), Buffer.from(adminUsername));
    const passwordMatch =
      password.length === adminPassword.length &&
      crypto.timingSafeEqual(Buffer.from(password), Buffer.from(adminPassword));

    if (!usernameMatch || !passwordMatch) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const token = createSessionToken(username);

    // Set cookie via NextResponse headers (most reliable method)
    const response = NextResponse.json({
      success: true,
      user: { username, role: "admin" },
    });

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
