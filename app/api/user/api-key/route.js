import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";
import crypto from "crypto";

// POST: Generate new API key
export async function POST(req) {
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

    // Generate new API key with "alf_" prefix and 32 random characters
    const randomBytes = crypto.randomBytes(16).toString("hex");
    const apiKey = `alf_${randomBytes}`;

    // Update user with new API key
    user.apiKey = apiKey;
    user.apiKeyCreatedAt = new Date();
    await user.save();

    // Return the API key (only time it will be shown in full)
    return NextResponse.json({
      apiKey,
      createdAt: user.apiKeyCreatedAt,
      message: "API key generated successfully. Save it securely - it won't be shown again.",
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}

// DELETE: Revoke API key
export async function DELETE(req) {
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

    if (!user.apiKey) {
      return NextResponse.json(
        { error: "No API key to revoke" },
        { status: 400 }
      );
    }

    // Revoke API key by removing it
    user.apiKey = undefined;
    user.apiKeyCreatedAt = undefined;
    await user.save();

    return NextResponse.json({
      message: "API key revoked successfully",
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}

// GET: Check if user has an API key (without revealing the key)
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

    // Return status without revealing the actual key
    const hasApiKey = !!user.apiKey;
    const lastFourChars = hasApiKey ? user.apiKey.slice(-4) : null;

    return NextResponse.json({
      hasApiKey,
      lastFourChars: lastFourChars ? `...${lastFourChars}` : null,
      createdAt: user.apiKeyCreatedAt || null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
