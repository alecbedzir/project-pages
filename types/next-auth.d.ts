import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    branchName: string;
    userGroupName: string;
    accessibleBranches: string[];
  }

  interface User {
    branchName?: string;
    userGroupName?: string;
    accessibleBranches?: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    branchName?: string;
    userGroupName?: string;
    accessibleBranches?: string[];
  }
}
