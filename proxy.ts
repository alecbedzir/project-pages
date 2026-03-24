export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    /*
     * Protect all routes except:
     *   - /auth/* (sign-in, error pages)
     *   - /api/auth/* (NextAuth handlers)
     *   - /api/webhook/* (GitHub webhook — validated by signature, not session)
     *   - /_next/* (Next.js internals)
     *   - /public files
     */
    "/((?!auth/|api/auth/|api/webhook/|_next/|favicon.ico|vaimo-logo).*)",
  ],
};
