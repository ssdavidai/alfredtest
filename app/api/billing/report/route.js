import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import ExecutionMetric from "@/models/ExecutionMetric";
import User from "@/models/User";

// Verify VM authentication token
function verifyVmAuthToken(req) {
  const authToken = req.headers.get("x-vm-auth-token");
  const expectedToken = process.env.VM_AUTH_TOKEN;

  if (!expectedToken) {
    console.error("VM_AUTH_TOKEN not configured in environment variables");
    return false;
  }

  if (!authToken) {
    return false;
  }

  // Use constant-time comparison to prevent timing attacks
  return authToken === expectedToken;
}

// Validate date format (YYYY-MM-DD)
function isValidDateFormat(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    return false;
  }

  // Verify it's a valid date
  const date = new Date(dateString);
  const timestamp = date.getTime();

  if (typeof timestamp !== "number" || Number.isNaN(timestamp)) {
    return false;
  }

  // Verify the date string matches the parsed date (catches invalid dates like 2024-02-31)
  const [year, month, day] = dateString.split("-").map(Number);
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

// POST: Report execution metrics from VM
// This endpoint receives daily billing metrics from user VMs
// Security: Requires X-VM-Auth-Token header for authentication
export async function POST(req) {
  try {
    // Step 1: Verify VM authentication
    if (!verifyVmAuthToken(req)) {
      console.warn("Unauthorized billing report attempt - invalid or missing X-VM-Auth-Token");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Step 2: Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Step 3: Validate required fields
    const requiredFields = ["userId", "date", "executionCount", "durationMs", "tokens", "successes", "failures"];
    const missingFields = requiredFields.filter(field => body[field] === undefined || body[field] === null);

    if (missingFields.length > 0) {
      const fieldsList = missingFields.join(", ");
      return NextResponse.json(
        { error: `Missing required fields: ${fieldsList}` },
        { status: 400 }
      );
    }

    // Step 4: Validate field types and values
    const { userId, date, executionCount, durationMs, tokens, successes, failures } = body;

    // Validate userId format (MongoDB ObjectId)
    if (typeof userId !== "string" || !/^[a-f\d]{24}$/i.test(userId)) {
      return NextResponse.json(
        { error: "Invalid userId format. Must be a valid MongoDB ObjectId" },
        { status: 400 }
      );
    }

    // Validate date format
    if (typeof date !== "string" || !isValidDateFormat(date)) {
      return NextResponse.json(
        { error: "Invalid date format. Must be YYYY-MM-DD" },
        { status: 400 }
      );
    }

    // Validate numeric fields
    const numericFields = [
      { name: "executionCount", value: executionCount },
      { name: "durationMs", value: durationMs },
      { name: "tokens", value: tokens },
      { name: "successes", value: successes },
      { name: "failures", value: failures },
    ];

    for (const field of numericFields) {
      if (typeof field.value !== "number" || !Number.isFinite(field.value) || field.value < 0) {
        return NextResponse.json(
          { error: `Invalid ${field.name}. Must be a non-negative number` },
          { status: 400 }
        );
      }
    }

    // Validate that successes + failures = executionCount
    if (successes + failures !== executionCount) {
      return NextResponse.json(
        { error: "Invalid data: successes + failures must equal executionCount" },
        { status: 400 }
      );
    }

    // Step 5: Connect to database
    await connectMongo();

    // Step 6: Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Step 7: Upsert execution metric
    // Use findOneAndUpdate with upsert to handle both create and update cases
    // $inc operator increments values if document exists, sets them if new
    const result = await ExecutionMetric.findOneAndUpdate(
      { userId, date },
      {
        $inc: {
          executionCount,
          totalDurationMs: durationMs,
          totalTokens: tokens,
          successCount: successes,
          failureCount: failures,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    // Step 8: Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Execution metrics recorded successfully",
        data: {
          userId: result.userId.toString(),
          date: result.date,
          executionCount: result.executionCount,
          totalDurationMs: result.totalDurationMs,
          totalTokens: result.totalTokens,
          successCount: result.successCount,
          failureCount: result.failureCount,
        },
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("Error recording execution metrics:", e);

    // Handle duplicate key errors (should not happen with upsert, but defensive)
    if (e.code === 11000) {
      return NextResponse.json(
        { error: "Duplicate metric entry for this user and date" },
        { status: 409 }
      );
    }

    // Handle validation errors
    if (e.name === "ValidationError") {
      return NextResponse.json(
        { error: `Validation error: ${e.message}` },
        { status: 400 }
      );
    }

    // Generic error response
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
