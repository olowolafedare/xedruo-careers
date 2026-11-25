import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/src/lib/auth/require-api-user";
import { withCentralAuthErrors } from "@/src/lib/auth/central-auth-response";

const XEDRION_COMPANY_ASSISTANT_URL =
  "https://xedrion-ai.xedruo.com/api/company-assistant";

export const POST = withCentralAuthErrors(async function POST(request: NextRequest) {
  const user = await requireApiUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // This is the server-to-server key configured on the Xedrion AI Worker as
  // XEDRION_COMPANY_API_KEY. Keep the matching value in this app's server secrets.
  const apiKey = process.env.XEDRION_COMPANY_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "Xedrion AI is not connected yet Configure XEDRION_COMPANY_API_KEY in the Career app server environment" },
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
    return NextResponse.json(
      { error: "Provide a job title and a short description of the role." },
      { status: 400 },
    );
  }

  const query = [
    "Create a professional, inclusive and practical job description for an employer using Xedruo Career.",
    "Return only the finished job description, with clear sections for role summary, responsibilities, required qualifications, experience and skills.",
    "Do not invent salary, benefits, location, company details, application deadlines or requirements that the employer has not supplied.",
    "Use the employer's notes as the source of truth. Improve clarity and structure without changing the intended role.",
    "",
    `Job title: ${title}`,
    `Employer's notes: ${prompt}`,
  ].join("\n");

  let response: Response;
  try {
    response = await fetch(XEDRION_COMPANY_ASSISTANT_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        query,
        conversation: [],
      }),
      signal: AbortSignal.timeout(35000),
      cache: "no-store",
    });
  } catch (error) {
    console.error("Xedrion AI request failed:", error);
    return NextResponse.json(
      { error: "Could not reach Xedrion AI Please try again or write the description manually" },
      { status: 502 },
    );
  }

  const result = await response.json().catch(() => null) as
    | { answer?: unknown; error?: unknown }
    | null;

  if (!response.ok) {
    console.error("Xedrion AI returned an error:", response.status);
    const message =
      typeof result?.error === "string"
        ? result.error
        : "Xedrion AI could not generate the job description.";
    return NextResponse.json({ error: message }, { status: response.status >= 500 ? 502 : response.status });
  }

  const description =
    typeof result?.answer === "string" ? result.answer.trim() : "";
  if (!description) {
    return NextResponse.json(
      { error: "Xedrion AI returned an empty response Please try again" },
      { status: 502 },
    );
  }

  return NextResponse.json({ description });
});
