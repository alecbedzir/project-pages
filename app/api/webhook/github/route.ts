import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { invalidateConfigCache } from "@/lib/github";

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expected = `sha256=${crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex")}`;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function POST(req: NextRequest) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    console.error("GITHUB_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const signature = req.headers.get("x-hub-signature-256");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  const payload = await req.text();

  if (!verifySignature(payload, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = req.headers.get("x-github-event");
  if (event !== "push") {
    return NextResponse.json({ message: "Ignored" }, { status: 200 });
  }

  const body = JSON.parse(payload);
  const ref: string = body.ref ?? "";

  // Only react to pushes on the main branch
  if (!ref.endsWith("/main") && ref !== "main") {
    return NextResponse.json({ message: "Not main branch, ignored" }, { status: 200 });
  }

  // Bust local config cache so next request reads fresh config
  invalidateConfigCache();

  // Trigger Vercel redeploy
  const deployHook = process.env.VERCEL_DEPLOY_HOOK_URL;
  if (deployHook) {
    try {
      await fetch(deployHook, { method: "POST" });
      console.log("Vercel deploy hook triggered");
    } catch (err) {
      console.error("Failed to trigger deploy hook:", err);
    }
  }

  return NextResponse.json({ message: "Deploy triggered" }, { status: 200 });
}
