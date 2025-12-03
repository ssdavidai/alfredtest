import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

/**
 * GET /api/proxy/vm/executions/[id]
 * Fetch a single execution by ID from the user's VM
 */
export async function GET(req, { params }) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get execution ID from params
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { error: "Execution ID is required" },
        { status: 400 }
      );
    }

    // Connect to database and get user's VM details
    await connectMongo();
    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has a VM provisioned
    if (!user.vmSubdomain || user.vmStatus !== 'ready') {
      return NextResponse.json(
        { error: "VM not ready. Please provision a VM first." },
        { status: 400 }
      );
    }

    // Construct VM API URL
    const vmUrl = `https://${user.vmSubdomain}/api/executions/${id}`;

    // Forward request to user's VM with authentication
    const vmResponse = await fetch(vmUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.vmAuthSecretHash}`,
      },
    });

    if (!vmResponse.ok) {
      const errorText = await vmResponse.text();
      console.error(`VM API error: ${vmResponse.status} - ${errorText}`);

      if (vmResponse.status === 404) {
        return NextResponse.json(
          { error: "Execution not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: "Failed to fetch execution from VM" },
        { status: vmResponse.status }
      );
    }

    const execution = await vmResponse.json();

    return NextResponse.json(execution);

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
