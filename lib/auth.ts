import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getAccessibleBranches } from "./config";
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
      async jwt({ token, user, trigger, session }) {
        // Initial sign-in: copy user group data into the token
        if (user) {
          if (user.userGroupName) token.userGroupName = user.userGroupName;
          if (user.branchName) token.branchName = user.branchName;
          if (user.accessibleBranches) token.accessibleBranches = user.accessibleBranches;
        }
        // Branch switch: validate and apply the requested branch
        if (trigger === "update" && session?.branchName) {
          const accessible = token.accessibleBranches ?? [];
          if (accessible.includes(session.branchName)) {
            token.branchName = session.branchName;
          }
        }
        return token;
      },
      async session({ session, token }) {
        session.branchName = (token.branchName as string) ?? "";
        session.userGroupName = (token.userGroupName as string) ?? "";
        session.accessibleBranches = (token.accessibleBranches as string[]) ?? [];
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

          const userGroup = config.userGroups.find(
            (g) => g.passphrase === credentials.passphrase
          );
          if (!userGroup) return null;

          const accessibleBranches = getAccessibleBranches(userGroup.name, config);
          if (accessibleBranches.length === 0) return null;

          return {
            id: userGroup.name,
            name: "Project Pages User",
            email: "user@projectpages",
            userGroupName: userGroup.name,
            branchName: accessibleBranches[0], // default to first accessible branch
            accessibleBranches,
          };
        },
      }),
    ],
  };
}
