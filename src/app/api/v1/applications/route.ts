import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

export async function GET() {
 const supabase = await createClient();
 const { data: { user }, error: authError } = await supabase.auth.getUser();
 if (authError || !user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
 const { data, error } = await supabase.from("careers_applications").select("id,job_id,status,created_at,careers_jobs!inner(id,title,location,type,careers_companies(name))").eq("candidate_id", user.id).order("created_at", { ascending: false });
 if (error) return NextResponse.json({ error: "Unable to fetch applications" }, { status: 500 });
 return NextResponse.json({ applications: data });
}

export async function POST(request: NextRequest) {
 const supabase = await createClient();
 const { data: { user }, error: authError } = await supabase.auth.getUser();
 if (authError || !user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

 let body: unknown;
 try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }
 if (!body || typeof body !== "object" || !("job_id" in body) || typeof body.job_id !== "string") {
 return NextResponse.json({ error: "A valid job_id is required" }, { status: 400 });
 }
 const jobId = body.job_id;
 const { data: job, error: jobError } = await supabase.from("careers_jobs").select("id,status").eq("id", jobId).maybeSingle();
 if (jobError) return NextResponse.json({ error: "Unable to check this job" }, { status: 500 });
 if (!job || job.status !== "published") return NextResponse.json({ error: "This job is no longer accepting applications" }, { status: 404 });

 const { data: existing, error: existingError } = await supabase.from("careers_applications").select("id").eq("job_id", jobId).eq("candidate_id", user.id).in("status", ["applied", "screening", "interview", "offered"]).limit(1).maybeSingle();
 if (existingError) return NextResponse.json({ error: "Unable to check your application" }, { status: 500 });
 if (existing) {
 return NextResponse.json({ error: "You have already applied for this job" }, { status: 409 });
 }
 const { data: application, error } = await supabase.from("careers_applications").insert({ job_id: jobId, candidate_id: user.id, status: "applied" }).select("id,job_id,status,created_at").single();
 if (error) {
 if (error.code === "23505") return NextResponse.json({ error: "You have already applied for this job" }, { status: 409 });
 return NextResponse.json({ error: "Unable to submit your application" }, { status: 500 });
 }
 return NextResponse.json({ application }, { status: 201 });
}
