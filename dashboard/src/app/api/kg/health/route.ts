import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pingNeo4j } from "@/lib/neo4j";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await pingNeo4j();
  return NextResponse.json(result, { status: result.ok ? 200 : 503 });
}
