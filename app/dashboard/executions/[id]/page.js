import { redirect } from "next/navigation";
import { auth } from "@/libs/auth";
import config from "@/config";
import ExecutionDetailView from "./ExecutionDetailView";

export const dynamic = "force-dynamic";

/**
 * Execution Detail Page
 * Shows detailed information about a single execution including:
 * - Header with skill name, status, duration
 * - Input section (JSON formatted)
 * - Output section
 * - Trace/steps accordion
 * - Token count and estimated cost
 */
export default async function ExecutionDetailPage({ params }) {
  const session = await auth();

  if (!session) {
    redirect(config.auth.loginUrl);
  }

  const { id } = params;

  return (
    <main className="min-h-screen p-4 md:p-8 pb-24">
      <div className="max-w-6xl mx-auto">
        <ExecutionDetailView executionId={id} />
      </div>
    </main>
  );
}
