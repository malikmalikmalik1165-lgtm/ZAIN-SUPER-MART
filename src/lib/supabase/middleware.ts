import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Edge-compatible HMAC verification using Web Crypto API
async function verifyHmac(
  data: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex === signature;
}

// Decode base64url (no padding, URL-safe chars)
function fromBase64url(str: string): string {
  // Restore standard base64
  let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  // Add padding
  while (b64.length % 4 !== 0) b64 += "=";
  return atob(b64);
}

// Verify ZSM session cookie
async function verifySession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get("zsm_session")?.value;
  if (!token) return false;

  try {
    const dotIndex = token.lastIndexOf(".");
    if (dotIndex === -1) return false;

    const payloadB64url = token.substring(0, dotIndex);
    const signature = token.substring(dotIndex + 1);
    if (!payloadB64url || !signature) return false;

    const secret = process.env.ZSM_SESSION_SECRET || "fallback-dev-secret";

    // HMAC was signed on the base64url-encoded payload string
    const valid = await verifyHmac(payloadB64url, signature, secret);
    if (!valid) return false;

    // Decode to check expiry
    const payload = fromBase64url(payloadB64url);
    const data = JSON.parse(payload);
    if (data.exp && data.exp < Date.now()) return false;

    return true;
  } catch {
    return false;
  }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const { pathname } = request.nextUrl;

  // Public routes
  const publicRoutes = [
    "/login",
    "/api/health",
    "/api/auth/login",
    "/api/auth/logout",
    "/api/auth/session",
  ];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Static assets
  const isStaticAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname === "/favicon.ico";

  if (isStaticAsset) return supabaseResponse;

  // Check ZSM custom session
  const hasZsmSession = await verifySession(request);

  // Also check Supabase auth (backward compatibility)
  let hasSupabaseSession = false;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== "https://placeholder.supabase.co"
  ) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    hasSupabaseSession = !!user;
  }

  // Demo mode - allow access with ?demo=true parameter (read-only)
  const isDemo = request.nextUrl.searchParams.get("demo") === "true" || request.cookies.get("zsm_demo")?.value === "true";
  if (isDemo && !isPublicRoute) {
    // Set demo cookie so subsequent requests don't need ?demo=true
    supabaseResponse.cookies.set("zsm_demo", "true", { path: "/", maxAge: 3600, httpOnly: false });
  }

  const isAuthenticated = hasZsmSession || hasSupabaseSession || isDemo;

  if (!isAuthenticated && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isAuthenticated && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
