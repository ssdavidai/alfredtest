import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

export async function POST(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    await connectMongo();
    const user = await User.findById(session.user.id);

    if (!user?.vmSubdomain) {
      return NextResponse.json({ error: "VM not provisioned" }, { status: 400 });
    }

    if (user.vmStatus !== "ready") {
      return NextResponse.json({ error: "VM not ready" }, { status: 400 });
    }

    // Forward execution request to user's VM
    const vmUrl = `https://${user.vmSubdomain}.alfredos.site/api/execute`;

    const response = await fetch(vmUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill_id: id, input: body.input || {} }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error }, { status: response.status });
    }

    const result = await response.json();
    return NextResponse.json({
      success: true,
      executionId: result.execution_id,
      status: result.status
    });
  } catch (error) {
    console.error("Skill execution error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
