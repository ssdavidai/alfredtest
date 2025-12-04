import NextAuth from "next-auth"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import GoogleProvider from "next-auth/providers/google"
import EmailProvider from "next-auth/providers/email"
import config from "@/config"
import connectMongo from "./mongo"

export const { handlers, auth, signIn, signOut } = NextAuth({

  // Trust the host header (required for custom domains on Vercel)
  trustHost: true,

  // Set any random key in .env.local
  secret: process.env.NEXTAUTH_SECRET,
  
  // Add EmailProvider only for server-side usage (not edge-compatible)
  providers: [
    // Follow the "Login with Email" tutorial to set up your email server
    // Requires a MongoDB database. Set MONGODB_URI env variable.
    ...(connectMongo
      ? [
          EmailProvider({
            server: {
              host: "smtp.resend.com",
              port: 465,
              auth: {
                user: "resend",
                pass: process.env.RESEND_API_KEY,
              },
            },
            from: config.resend.fromNoReply,
          }),
          GoogleProvider({
            // Follow the "Login with Google" tutorial to get your credentials
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
          }),
        ]
      : []),
  ],
  
  // New users will be saved in Database (MongoDB Atlas). Each user (model) has some fields like name, email, image, etc..
  // Requires a MongoDB database. Set MONGODB_URI env variable.
  // Learn more about the model type: https://authjs.dev/concepts/database-models
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
    // Logo is optional - add /public/logoAndName.png if you want a custom logo on the signin page
  },
}); 