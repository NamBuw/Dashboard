import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const RAG_SERVER_URL = process.env.RAG_SERVER_URL || "http://171.226.10.121:8888";

/**
 * POST /api/rag-query
 * Query the RAG server for book/knowledge results.
 * Body: { query: string, sessionId?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { query, sessionId } = await request.json();

    if (!query || !query.trim()) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    // Call RAG server
    const ragResponse = await fetch(`${RAG_SERVER_URL}/v2/rag/retrieve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: query.trim(),
        session_id: sessionId || "dashboard",
        user_profile: {
          username: session.user.name,
          user_id: session.user.id,
        },
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!ragResponse.ok) {
      return NextResponse.json(
        { error: "RAG server error", status: ragResponse.status },
        { status: 502 }
      );
    }

    const ragData = await ragResponse.json();

    // Parse context if it's JSON
    let parsedContext = ragData.context;
    let contentLines: string[] = [];
    let recitationTitle = "";

    try {
      const contextObj = JSON.parse(ragData.context);
      if (contextObj.type === "full_recitation_lines" && contextObj.lines) {
        recitationTitle = contextObj.title || "";
        contentLines = contextObj.lines.map((l: any) => l.text || l.line || "");
      }
    } catch {
      // context is plain text
      contentLines = ragData.context ? ragData.context.split("\n") : [];
    }

    return NextResponse.json({
      query: query.trim(),
      intent: ragData.intent || {},
      sources: ragData.sources || [],
      context: parsedContext,
      contentLines,
      recitationTitle,
    });
  } catch (error: any) {
    console.error("RAG query error:", error);

    if (error?.name === "TimeoutError") {
      return NextResponse.json({ error: "RAG server timeout" }, { status: 504 });
    }

    return NextResponse.json({ error: "Failed to query RAG server" }, { status: 500 });
  }
}
