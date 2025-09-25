import GoogleProvider from "next-auth/providers/google";
import type { AuthOptions } from "next-auth";
import db from "@repo/db/client";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user?.email) return false;

      await db.merchant.upsert({
        select: { id: true },
        where: { email: user.email },
        create: {
          email: user.email,
          name: user.name || "",
          auth_type: account?.provider === "google" ? "Google" : "Github"
        },
        update: {
          name: user.name || "",
          auth_type: account?.provider === "google" ? "Google" : "Github"
        }
      });

      return true;
    }
  },
  secret: process.env.NEXTAUTH_SECRET!
};
