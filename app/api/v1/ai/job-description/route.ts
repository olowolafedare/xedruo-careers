import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/src/lib/auth/require-api-user";
import { withCentralAuthErrors } from "@/src/lib/auth/central-auth-response";

export const POST = withCentralAuthErrors(async function POST(request: NextRequest) {
  const user = await requireApiUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI job description generation is not configured yet. Add OPENAI_API_KEY to the server environment." },
      { status: 503 },
    );
  }

  let body: { title?: unknown; prompt?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim().slice(0, 200) : "";
  const prompt = typeof body.prompt === "string" ? body.prompt.trim().slice(0, 4000) : "";
  if (!title || !prompt) {
    return NextResponse.json({ error: "Provide a job title and a short description of the role." }, { status: 400 });
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content: "Write a clear, inclusive, realistic job description. Return only the job description with concise sections for role summary, responsibilities, qualifications, experience and skills. Do not invent salary, location, benefits or company facts.",
        },
        {
          role: "user",
          content: `Job title: ${title}\nEmployer's notes: ${prompt}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    console.error("AI job description provider returned", response.status);
    return NextResponse.json({ error: "AI generation is temporarily unavailable. Please write or edit the description manually." }, { status: 502 });
  }

  const result = await response.json() as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const description = result.choices?.[0]?.message?.content?.trim();
  if (!description) {
    return NextResponse.json({ error: "The AI provider returned an empty description." }, { status: 502 });
  }

  return NextResponse.json({ description });
});
