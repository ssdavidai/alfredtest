import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { subdomain, authSecret, publicKey } = await req.json();

    if (!subdomain || !authSecret) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectMongo();

    // Find user by subdomain
    const user = await User.findOne({ vmSubdomain: subdomain });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.vmStatus === "ready") {
      return NextResponse.json({ error: "VM already registered" }, { status: 400 });
    }

    // Verify the auth secret matches what we stored during provisioning
    if (!user.vmAuthSecretHash) {
      return NextResponse.json({ error: "No auth secret expected for this VM" }, { status: 400 });
    }

    const isValidSecret = await bcrypt.compare(authSecret, user.vmAuthSecretHash);
    if (!isValidSecret) {
      console.error(`Invalid auth secret for subdomain ${subdomain}`);
      return NextResponse.json({ error: "Invalid auth secret" }, { status: 401 });
    }

    // Update user record - VM is now verified and ready
    user.vmStatus = "ready";
    user.vmPublicKey = publicKey || null;
    user.vmProvisionedAt = new Date();
    await user.save();

    console.log(`VM registered successfully for subdomain ${subdomain}`);

    return NextResponse.json({
      success: true,
      message: "VM registered successfully"
    });
  } catch (error) {
    console.error("VM registration error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
