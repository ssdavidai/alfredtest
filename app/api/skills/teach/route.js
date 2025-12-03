import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();
    const user = await User.findById(session.user.id);

    if (!user?.vmSubdomain) {
      return NextResponse.json({ error: "VM not provisioned" }, { status: 400 });
    }

    const { prompt, name } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Forward to user's VM async-agent for skill generation
    const vmUrl = `https://${user.vmSubdomain}.alfredos.site/api/execute/teach`;

    const response = await fetch(vmUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, name }),
    });

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Teach skill error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
