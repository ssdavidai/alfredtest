import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

export async function POST(req, { params }) {
  try {
    const { skillId, secret } = await params;
    const body = await req.json().catch(() => ({}));

    await connectMongo();

    // Find user by webhook secret (stored in skill config on VM)
    // For now, we extract subdomain from the referer or a header
    const subdomain = req.headers.get("x-alfred-subdomain");

    if (!subdomain) {
      return NextResponse.json({ error: "Missing subdomain" }, { status: 400 });
    }

    const user = await User.findOne({ vmSubdomain: subdomain });

    if (!user || user.vmStatus !== "ready") {
      return NextResponse.json({ error: "VM not found or not ready" }, { status: 404 });
    }

    // Forward webhook to user's VM
    const vmUrl = `https://${user.vmSubdomain}.alfredos.site/webhook/${skillId}/${secret}`;

    const response = await fetch(vmUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    console.error("Webhook proxy error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req, { params }) {
  // Support GET webhooks too
  return POST(req, { params });
}
