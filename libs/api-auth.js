import connectMongo from "./mongoose";
import User from "@/models/User";
import crypto from "crypto";

export async function validateApiKey(apiKey) {
  if (!apiKey || !apiKey.startsWith("alf_")) {
    return null;
  }

  await connectMongo();

  // Hash the API key for comparison
  const hash = crypto.createHash("sha256").update(apiKey).digest("hex");

  const user = await User.findOne({ apiKeyHash: hash });

  if (!user) {
    return null;
  }

  return user;
}

export async function withApiAuth(req, handler) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer alf_")) {
    return { error: "Invalid or missing API key", status: 401 };
  }

  const apiKey = authHeader.slice(7); // Remove "Bearer "
  const user = await validateApiKey(apiKey);

  if (!user) {
    return { error: "Invalid API key", status: 401 };
  }

  return handler(req, user);
}
