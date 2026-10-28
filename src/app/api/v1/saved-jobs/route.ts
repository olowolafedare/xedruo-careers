import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

export async function POST(request: NextRequest) {
 const supabase = await createClient();
 const { data: { user }, error: authError } = await supabase.auth.getUser();
 if (authError || !user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
 let body: unknown;
 try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }
 if (!body || typeof body !== "object" || !("job_id" in body) || typeof body.job_id !== "string") return NextResponse.json({ error: "A valid job_id is required" }, { status: 400 });
 const { error } = await supabase.from("careers_saved_jobs").upsert({ candidate_id: user.id, job_id: body.job_id }, { onConflict: "candidate_id,job_id", ignoreDuplicates: true });
 if (error) return NextResponse.json({ error: "Unable to save this job" }, { status: 500 });
 return NextResponse.json({ saved: true });
}

export async function DELETE(request: NextRequest) {
 const supabase = await createClient();
 const { data: { user }, error: authError } = await supabase.auth.getUser();
 if (authError || !user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
 const jobId = request.nextUrl.searchParams.get("job_id");
 if (!jobId) return NextResponse.json({ error: "A job_id is required" }, { status: 400 });
 const { error } = await supabase.from("careers_saved_jobs").delete().eq("candidate_id", user.id).eq("job_id", jobId);
 if (error) return NextResponse.json({ error: "Unable to remove this saved job" }, { status: 500 });
 return NextResponse.json({ saved: false });
}
