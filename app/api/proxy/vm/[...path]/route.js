import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

/**
 * VM Proxy Route - Catch-all proxy to forward requests to user's VM
 *
 * This route proxies requests to the user's provisioned VM at:
 * https://{vmSubdomain}.alfredos.site/api/{path}
 *
 * Supports: GET, POST, PUT, DELETE
 * Authentication: Required (JWT session)
 * VM Status: Must be 'ready'
 */

// Helper function to construct VM URL
function constructVmUrl(vmSubdomain, path) {
  const pathString = Array.isArray(path) ? path.join('/') : path;
  return `https://${vmSubdomain}.alfredos.site/api/${pathString}`;
}

// Helper function to forward request to VM
async function forwardToVm(vmUrl, method, headers, body) {
  const options = {
    method,
    headers: {
      'Content-Type': headers.get('content-type') || 'application/json',
      'Accept': headers.get('accept') || 'application/json',
      // Forward other relevant headers
      ...(headers.get('user-agent') && { 'User-Agent': headers.get('user-agent') }),
      // TODO: Add JWT signing for secure VM authentication
      // 'X-Alfred-Auth': signedJwt,
    },
  };

  // Add body for methods that support it
  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = body;
  }

  const response = await fetch(vmUrl, options);
  return response;
}

// Helper function to handle errors safely
function handleError(error, statusCode = 500) {
  console.error('VM Proxy Error:', error);

  // Don't expose internal error details to client
  const safeMessage = statusCode === 503
    ? 'VM is not ready'
    : statusCode === 404
    ? 'VM not found'
    : 'Proxy request failed';

  return NextResponse.json(
    { error: safeMessage },
    { status: statusCode }
  );
}

// GET handler
export async function GET(req, { params }) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectMongo();

    // Get user with VM details
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if VM is ready
    if (user.vmStatus !== 'ready') {
      return NextResponse.json(
        { error: 'VM is not ready', vmStatus: user.vmStatus },
        { status: 503 }
      );
    }

    // Validate VM configuration
    if (!user.vmSubdomain) {
      return NextResponse.json(
        { error: 'VM not configured' },
        { status: 500 }
      );
    }

    // Construct VM URL
    const vmUrl = constructVmUrl(user.vmSubdomain, params.path);

    // Forward request to VM
    const vmResponse = await forwardToVm(
      vmUrl,
      'GET',
      req.headers,
      null
    );

    // Forward VM response back to client
    const data = await vmResponse.text();

    return new NextResponse(data, {
      status: vmResponse.status,
      headers: {
        'Content-Type': vmResponse.headers.get('content-type') || 'application/json',
      },
    });

  } catch (error) {
    return handleError(error);
  }
}

// POST handler
export async function POST(req, { params }) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectMongo();

    // Get user with VM details
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if VM is ready
    if (user.vmStatus !== 'ready') {
      return NextResponse.json(
        { error: 'VM is not ready', vmStatus: user.vmStatus },
        { status: 503 }
      );
    }

    // Validate VM configuration
    if (!user.vmSubdomain) {
      return NextResponse.json(
        { error: 'VM not configured' },
        { status: 500 }
      );
    }

    // Get request body
    const body = await req.text();

    // Construct VM URL
    const vmUrl = constructVmUrl(user.vmSubdomain, params.path);

    // Forward request to VM
    const vmResponse = await forwardToVm(
      vmUrl,
      'POST',
      req.headers,
      body
    );

    // Forward VM response back to client
    const data = await vmResponse.text();

    return new NextResponse(data, {
      status: vmResponse.status,
      headers: {
        'Content-Type': vmResponse.headers.get('content-type') || 'application/json',
      },
    });

  } catch (error) {
    return handleError(error);
  }
}

// PUT handler
export async function PUT(req, { params }) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectMongo();

    // Get user with VM details
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if VM is ready
    if (user.vmStatus !== 'ready') {
      return NextResponse.json(
        { error: 'VM is not ready', vmStatus: user.vmStatus },
        { status: 503 }
      );
    }

    // Validate VM configuration
    if (!user.vmSubdomain) {
      return NextResponse.json(
        { error: 'VM not configured' },
        { status: 500 }
      );
    }

    // Get request body
    const body = await req.text();

    // Construct VM URL
    const vmUrl = constructVmUrl(user.vmSubdomain, params.path);

    // Forward request to VM
    const vmResponse = await forwardToVm(
      vmUrl,
      'PUT',
      req.headers,
      body
    );

    // Forward VM response back to client
    const data = await vmResponse.text();

    return new NextResponse(data, {
      status: vmResponse.status,
      headers: {
        'Content-Type': vmResponse.headers.get('content-type') || 'application/json',
      },
    });

  } catch (error) {
    return handleError(error);
  }
}

// DELETE handler
export async function DELETE(req, { params }) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectMongo();

    // Get user with VM details
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if VM is ready
    if (user.vmStatus !== 'ready') {
      return NextResponse.json(
        { error: 'VM is not ready', vmStatus: user.vmStatus },
        { status: 503 }
      );
    }

    // Validate VM configuration
    if (!user.vmSubdomain) {
      return NextResponse.json(
        { error: 'VM not configured' },
        { status: 500 }
      );
    }

    // Construct VM URL
    const vmUrl = constructVmUrl(user.vmSubdomain, params.path);

    // Forward request to VM
    const vmResponse = await forwardToVm(
      vmUrl,
      'DELETE',
      req.headers,
      null
    );

    // Forward VM response back to client
    const data = await vmResponse.text();

    return new NextResponse(data, {
      status: vmResponse.status,
      headers: {
        'Content-Type': vmResponse.headers.get('content-type') || 'application/json',
      },
    });

  } catch (error) {
    return handleError(error);
  }
}
