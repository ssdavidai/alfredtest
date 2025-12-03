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
    await connectMongo();
    const user = await User.findById(session.user.id);

    if (!user?.vmSubdomain) {
      return NextResponse.json({ error: "VM not provisioned" }, { status: 400 });
    }

    // Forward discovery request to user's VM
    const vmUrl = `https://${user.vmSubdomain}.alfredos.site/api/connections/${id}/discover`;

    const response = await fetch(vmUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error }, { status: response.status });
    }

    const tools = await response.json();
    return NextResponse.json({ success: true, tools });
  } catch (error) {
    console.error("Connection discovery error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
