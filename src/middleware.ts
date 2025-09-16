import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/admin")) return NextResponse.next();

  // Only challenge when the user is actually navigating to the page
  const isPageNav =
    req.headers.get("sec-fetch-mode") === "navigate" ||
    req.headers.get("accept")?.includes("text/html");

  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    const [, encoded] = auth.split(" ");
    const [u, p] = Buffer.from(encoded, "base64").toString().split(":");
    if (u === process.env.ADMIN_USER && p === process.env.ADMIN_PASS) {
      return NextResponse.next();
    }
  }

  // On navigation -> show browser prompt. On prefetch/XHR -> return JSON 401 silently.
  if (isPageNav) {
    return new NextResponse("Auth required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Budstagram Admin"' },
    });
  }
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export const config = { matcher: ["/admin/:path*"] };
