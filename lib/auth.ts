import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getConfig } from "./github";

export async function buildAuthOptions(): Promise<NextAuthOptions> {
  let sessionMaxAge = 7 * 24 * 60 * 60; // default: 7 days in seconds

  try {
    const config = await getConfig();
    sessionMaxAge = config.auth.sessionDurationDays * 24 * 60 * 60;
  } catch {
    // If config isn't reachable at auth setup time, fall back to default
  }

  return {
    secret: process.env.NEXTAUTH_SECRET,
    session: {
      strategy: "jwt",
      maxAge: sessionMaxAge,
    },
    pages: {
      signIn: "/auth/signin",
      error: "/auth/error",
    },
    callbacks: {
      async jwt({ token, user }) {
        if (user && "branchName" in user) {
          token.branchName = user.branchName as string;
        }
        return token;
      },
      async session({ session, token }) {
        session.branchName = (token.branchName as string) ?? "";
        return session;
      },
    },
    providers: [
      CredentialsProvider({
        name: "Passphrase",
        credentials: {
          passphrase: { label: "Passphrase", type: "password" },
        },
        async authorize(credentials) {
          if (!credentials?.passphrase) return null;

          let config;
          try {
            config = await getConfig();
          } catch {
            throw new Error("Unable to load configuration");
          }

          const branch = config.branches.find(
            (b) => b.passphrase === credentials.passphrase
          );
          if (!branch) return null;

          return {
            id: branch.name,
            name: "Vaimo Team",
            email: "team@vaimo.com",
            branchName: branch.name,
          };
        },
      }),
    ],
  };
}
