import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

// This route returns the current user's status including VM provisioning status and access URLs
// It's called by the dashboard to check if the user's VM is ready and provide access links
export async function GET(req) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    await connectMongo();

    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build response based on user's VM status
    const response = {
      hasAccess: user.hasAccess || false,
      vmStatus: user.vmStatus || "pending",
      vmSubdomain: user.vmSubdomain || null,
      vmIp: user.vmIp || null,
      dashboardUrl: null,
      librechatUrl: null,
      nocodbUrl: null,
    };

    // If VM is ready and subdomain exists, provide the full URLs
    if (user.vmStatus === "ready" && user.vmSubdomain) {
      const baseUrl = `https://${user.vmSubdomain}.alfredos.site`;
      response.dashboardUrl = baseUrl;
      response.librechatUrl = `${baseUrl}/librechat`;
      response.nocodbUrl = `${baseUrl}/nocodb`;
    }

    return NextResponse.json(response);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
