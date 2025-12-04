import NextAuth from "next-auth"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import GoogleProvider from "next-auth/providers/google"
import Resend from "next-auth/providers/resend"
import config from "@/config"
import connectMongo from "./mongo"

// Build providers array based on available credentials
const providers = [];

// Add Resend Email Provider if MongoDB and Resend are configured
if (connectMongo && process.env.RESEND_API_KEY) {
  providers.push(
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: config.resend.fromNoReply,
    })
  );
}

// Add GoogleProvider if credentials are configured
if (process.env.GOOGLE_ID && process.env.GOOGLE_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      async profile(profile) {
        return {
          id: profile.sub,
          name: profile.given_name ? profile.given_name : profile.name,
          email: profile.email,
          image: profile.picture,
          createdAt: new Date(),
        };
      },
    })
  );
}

// Log warning if no providers configured
if (providers.length === 0) {
  console.error("⚠️ No auth providers configured! Check environment variables:");
  console.error("  - MONGODB_URI (for EmailProvider)");
  console.error("  - RESEND_API_KEY (for EmailProvider)");
  console.error("  - GOOGLE_ID and GOOGLE_SECRET (for GoogleProvider)");
}

export const { handlers, auth, signIn, signOut } = NextAuth({

  // Debug mode - enable for troubleshooting auth issues
  debug: process.env.NODE_ENV === "development",

  // Trust the host header (required for custom domains on Vercel)
  trustHost: true,

  // Set any random key in .env.local
  secret: process.env.NEXTAUTH_SECRET,

  providers,

  // Use MongoDB adapter if available
  ...(connectMongo && { adapter: MongoDBAdapter(connectMongo) }),

  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  cookies: {
    csrfToken: {
      name: "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
  },
  theme: {
    brandColor: config.colors.main,
  },
}); 