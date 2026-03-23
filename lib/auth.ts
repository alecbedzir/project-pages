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
    providers: [
      CredentialsProvider({
        name: "Passphrase",
        credentials: {
          passphrase: { label: "Passphrase", type: "password" },
        },
        async authorize(credentials) {
          const expected = process.env.AUTH_PASSPHRASE;
          if (!expected) throw new Error("AUTH_PASSPHRASE is not configured");
          if (credentials?.passphrase !== expected) return null;
          // Return a minimal user object — no real identity in passphrase mode
          return { id: "team", name: "Vaimo Team", email: "team@vaimo.com" };
        },
      }),
    ],
  };
}
