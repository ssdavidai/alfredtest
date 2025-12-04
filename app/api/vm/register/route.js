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

    // Hash the auth secret (we never store plaintext)
    const authSecretHash = await bcrypt.hash(authSecret, 10);

    // Update user record
    user.vmStatus = "ready";
    user.vmAuthSecretHash = authSecretHash;
    user.vmPublicKey = publicKey || null;
    user.vmProvisionedAt = new Date();
    await user.save();

    return NextResponse.json({
      success: true,
      message: "VM registered successfully"
    });
  } catch (error) {
    console.error("VM registration error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
