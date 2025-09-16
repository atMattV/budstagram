import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const auth = req.headers.get("authorization");

  if (auth?.startsWith("Basic ")) {
    const [, encoded] = auth.split(" ");
    const [u, p] = Buffer.from(encoded, "base64").toString().split(":");

    if (u === process.env.ADMIN_USER && p === process.env.ADMIN_PASS) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Auth required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Budstagram Admin"' },
  });
}

// ⚠️ IMPORTANT: ensure matcher is exported *after* the middleware
export const config = {
  matcher: ["/admin/:path*"],
};
