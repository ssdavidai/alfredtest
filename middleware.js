import { NextResponse } from "next/server"

export function middleware(req) {
  const url = req.nextUrl

  // Redirect www to non-www to prevent CSRF issues with cookie domains
  if (url.hostname === "www.alfred.rocks") {
    url.hostname = "alfred.rocks"
    return NextResponse.redirect(url, 301)
  }

  return NextResponse.next()
}

// Only run middleware on non-API, non-static paths
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
} 