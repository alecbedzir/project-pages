import NextAuth from "next-auth";
import { buildAuthOptions } from "@/lib/auth";

async function handler(...args: Parameters<ReturnType<typeof NextAuth>>) {
  const options = await buildAuthOptions();
  return NextAuth(options)(...args);
}

export { handler as GET, handler as POST };
