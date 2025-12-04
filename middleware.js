import { NextResponse } from "next/server"
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

// Edge-compatible configuration for middleware (without EmailProvider and MongoDB adapter)
// When using NextAuth.js in middleware, you need to use the edge-compatible configuration
// This is because the middleware runs in an edge environment, and the EmailProvider is not compatible with edge environments
// The MongoDB adapter is also not compatible with edge environments, so we need to use the edge-compatible configuration
const { auth } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
})

export default auth(async function middleware(req) {
  const url = req.nextUrl

  // Redirect www to non-www to prevent CSRF issues with cookie domains
  if (url.hostname === "www.alfred.rocks") {
    url.hostname = "alfred.rocks"
    return NextResponse.redirect(url, 301)
  }

  // Your custom middleware logic goes here if needed
})

// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
} 