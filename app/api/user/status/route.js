import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

// GET: Fetch user status (subscription, VM status, subdomain, API key info)
export async function GET(req) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  try {
    await connectMongo();

    const { id } = session.user;
    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get API key info without revealing the full key
    const hasApiKey = !!user.apiKey;
    const maskedApiKey = hasApiKey
      ? `alf_${"*".repeat(24)}${user.apiKey.slice(-4)}`
      : null;

    return NextResponse.json({
      hasAccess: user.hasAccess,
      vmStatus: user.vmStatus,
      vmSubdomain: user.vmSubdomain,
      vmIp: user.vmIp,
      hasApiKey,
      maskedApiKey,
      apiKeyCreatedAt: user.apiKeyCreatedAt || null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
