import { NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

// Test secret - must match E2E_TEST_SECRET in environment
const TEST_SECRET = process.env.E2E_TEST_SECRET;
const TEST_USER_EMAIL = "test@alfred.rocks";

/**
 * Test-only authentication endpoint for E2E tests
 *
 * This endpoint bypasses the normal email magic link flow to allow
 * automated E2E tests to authenticate directly.
 *
 * Security:
 * - Only works when E2E_TEST_SECRET is set
 * - Only authenticates the designated test user
 * - Requires the secret to be passed in the request
 */
export async function POST(req) {
  try {
    // Require test secret to be configured
    if (!TEST_SECRET) {
      return NextResponse.json(
        { error: "Test login not available" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { secret, email, skipProvisioning, reset } = body;

    // Validate secret
    if (secret !== TEST_SECRET) {
      return NextResponse.json(
        { error: "Invalid test secret" },
        { status: 401 }
      );
    }

    // Only allow test user email
    if (email !== TEST_USER_EMAIL) {
      return NextResponse.json(
        { error: "Only test user email allowed" },
        { status: 403 }
      );
    }

    // Find or create the test user in database with subscription access
    await connectMongo();
    let user = await User.findOne({ email: TEST_USER_EMAIL });

    if (!user) {
      // Create the test user if it doesn't exist
      // Only set hasAccess: true, let user trigger provisioning manually
      const userData = {
        email: TEST_USER_EMAIL,
        name: "E2E Test User",
        hasAccess: true,
      };

      // If skipProvisioning=true (for E2E tests), pre-provision the VM
      if (skipProvisioning) {
        userData.vmStatus = 'ready';
        userData.vmSubdomain = 'test-demo';
        userData.vmIp = '127.0.0.1';
      }

      user = await User.create(userData);
    } else {
      // Ensure test user has subscription access
      const updates = {};
      if (!user.hasAccess) updates.hasAccess = true;

      // If reset=true, clear VM fields to test provisioning flow
      if (reset) {
        updates.vmStatus = 'pending';
        updates.vmSubdomain = null;
        updates.vmIp = null;
        updates.vmHetznerId = null;
        updates.vmProvisionedAt = null;
      }
      // If skipProvisioning=true, set up VM fields for E2E tests
      else if (skipProvisioning) {
        if (user.vmStatus !== 'ready') updates.vmStatus = 'ready';
        if (!user.vmSubdomain) updates.vmSubdomain = 'test-demo';
        if (!user.vmIp) updates.vmIp = '127.0.0.1';
      }

      if (Object.keys(updates).length > 0) {
        await User.findByIdAndUpdate(user._id, updates);
        user = await User.findById(user._id);
      }
    }

    // Determine cookie name based on environment (HTTPS uses __Secure- prefix)
    // This also determines the salt used for JWT encryption
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
    const cookieName = isProduction ? '__Secure-authjs.session-token' : 'authjs.session-token';

    // Create JWT session token using NextAuth's encode function
    // The salt must match the cookie name for proper decryption
    const token = await encode({
      token: {
        sub: user._id.toString(),
        email: user.email,
        name: user.name,
      },
      secret: process.env.NEXTAUTH_SECRET,
      salt: cookieName, // Salt must match cookie name
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    // Return the token and cookie name for client to set cookie
    return NextResponse.json({
      success: true,
      token: token,
      cookieName: cookieName, // Client should use this exact cookie name
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
    });

  } catch (error) {
    console.error("[Test Login] Error:", error.message);
    console.error("[Test Login] Stack:", error.stack);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
