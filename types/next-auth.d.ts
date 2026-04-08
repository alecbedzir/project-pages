import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    branchName: string;
  }

  interface User {
    branchName?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    branchName?: string;
  }
}
