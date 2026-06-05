import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Trỏ THẲNG Gemma-4 (không qua RAG nữa). Giải thích nhanh, max_tokens ngắn.
const LLM_URL = process.env.LLM_API_URL || "http://171.226.10.121:8000/llm/v1/chat/completions";
const LLM_MODEL = process.env.LLM_MODEL || "gemma-4";
const LLM_KEY = process.env.LLM_API_KEY || "";
const LLM_MAX_TOKENS = parseInt(process.env.LLM_MAX_TOKENS || "256", 10);

/**
 * POST /api/rag-query
 * Hỏi nhanh Gemma-4 (giải thích ngắn gọn). Body: { query: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { query } = await request.json();
    if (!query || !query.trim()) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    const llmRes = await fetch(LLM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LLM_KEY}`,
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [
          {
            role: "system",
            content:
              "Bạn là trợ lý giáo dục cho học sinh Việt Nam. Trả lời NGẮN GỌN, súc tích, dễ hiểu bằng tiếng Việt (tối đa vài câu). Giải thích nhanh, đi thẳng vào ý chính, không lan man.",
          },
          { role: "user", content: query.trim() },
        ],
        max_tokens: LLM_MAX_TOKENS,
        temperature: 0.5,
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!llmRes.ok) {
      return NextResponse.json({ error: "LLM error", status: llmRes.status }, { status: 502 });
    }

    const data = await llmRes.json();
    const answer: string = (data?.choices?.[0]?.message?.content ?? "").trim();

    // Giữ nguyên shape cho frontend (context = câu trả lời; sources rỗng → không hiện nguồn)
    return NextResponse.json({
      query: query.trim(),
      intent: {},
      sources: [],
      context: answer,
      contentLines: answer ? answer.split("\n") : [],
      recitationTitle: "",
    });
  } catch (error: unknown) {
    console.error("LLM query error:", error);
    if ((error as { name?: string })?.name === "TimeoutError") {
      return NextResponse.json({ error: "LLM timeout" }, { status: 504 });
    }
    return NextResponse.json({ error: "Failed to query LLM" }, { status: 500 });
  }
}
