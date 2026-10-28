import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/src/lib/supabase/server';
import {
 getPageRange,
 getTotalPages,
 MAX_PAGE_NUMBER,
 MAX_PAGE_SIZE,
 parsePage,
 parsePageSize,
} from '@/src/lib/pagination';

export async function GET(request: NextRequest) {
 const requestedPage = request.nextUrl.searchParams.get('page') ?? undefined;
 const requestedPageSize = request.nextUrl.searchParams.get('pageSize') ?? undefined;

 if (
 (requestedPage !== undefined &&
 (!/^\d+$/.test(requestedPage) ||
 Number(requestedPage) < 1 ||
 Number(requestedPage) > MAX_PAGE_NUMBER)) ||
 (requestedPageSize !== undefined &&
 (!/^\d+$/.test(requestedPageSize) ||
 Number(requestedPageSize) < 1 ||
 Number(requestedPageSize) > MAX_PAGE_SIZE))
 ) {
 return NextResponse.json(
 {
 error: `page must be between 1 and ${MAX_PAGE_NUMBER}, and pageSize must be between 1 and ${MAX_PAGE_SIZE}`,
 },
 { status: 400 },
 );
 }

 const page = parsePage(requestedPage);
 const pageSize = parsePageSize(requestedPageSize);
 const { from, to } = getPageRange(page, pageSize);
 const supabase = await createClient();

 const { data: jobs, error, count } = await supabase
 .from('hireuo_jobs')
 .select(`
 id,
 slug,
 title,
 description,
 requirements,
 responsibilities,
 city,
 state,
 country,
 employment_type,
 workplace_type,
 created_at
 `, { count: 'exact' })
 .eq('status', 'published')
 .order('created_at', { ascending: false })
 .range(from, to);

 if (error) {
 return NextResponse.json(
 { error: 'Unable to fetch jobs' },
 { status: 500 },
 );
 }

 const total = count ?? 0;
 return NextResponse.json({
 jobs: jobs?.map((job) => ({ ...job, company: null })),
 pagination: {
 page,
 pageSize,
 total,
 totalPages: getTotalPages(total, pageSize),
 },
 });
}

export async function POST(request: NextRequest) {
 const supabase = await createClient();

 const {
 data: { user },
 error: authError,
 } = await supabase.auth.getUser();

 if (authError || !user) {
 return NextResponse.json(
 { error: 'Authentication required' },
 { status: 401 },
 );
 }

 let body: Record<string, unknown>;

 try {
 const contentType = request.headers.get('content-type') ?? '';

 if (contentType.includes('application/json')) {
 body = await request.json();
 } else {
 const formData = await request.formData();
 body = Object.fromEntries(formData.entries());
 }
 } catch {
 return NextResponse.json(
 { error: 'Invalid request body' },
 { status: 400 },
 );
 }

 const companyId =
 typeof body.company_id === 'string' ? body.company_id : '';
 const title = typeof body.title === 'string' ? body.title.trim() : '';
 const description =
 typeof body.description === 'string'
 ? body.description.trim()
 : '';
 const city =
 typeof body.city === 'string' ? body.city.trim() : '';
 const employmentType = body.employment_type;
 const workplaceType = body.workplace_type;

 const allowedEmploymentTypes = [
 'full_time',
 'part_time',
 'contract',
 'internship',
 'temporary',
 'freelance',
 ];
 const allowedWorkplaceTypes = ['onsite', 'remote', 'hybrid'];

 if (
 !companyId ||
 !title ||
 title.length > 200 ||
 !description ||
 city.length > 160 ||
 !allowedEmploymentTypes.includes(String(employmentType)) ||
 !allowedWorkplaceTypes.includes(String(workplaceType))
 ) {
 return NextResponse.json(
 { error: 'Please provide valid job details' },
 { status: 400 },
 );
 }

 const { data: membership, error: membershipError } = await supabase
 .from('careers_company_members')
 .select('company_id')
 .eq('company_id', companyId)
 .eq('profile_id', user.id)
 .in('role', ['admin', 'recruiter'])
 .maybeSingle();

 if (membershipError) {
 return NextResponse.json(
 { error: 'Unable to verify company permissions' },
 { status: 500 },
 );
 }

 if (!membership) {
 return NextResponse.json(
 { error: 'You cannot create jobs for this company' },
 { status: 403 },
 );
 }

 const { data: job, error: insertError } = await supabase
 .from('hireuo_jobs')
 .insert({
 company_id: membership.company_id,
 recruiter_id: user.id,
 title,
 description,
 city: city || null,
 employment_type: String(employmentType),
 workplace_type: String(workplaceType),
 status: 'draft',
 })
 .select('id, title, status')
 .single();

 if (insertError) {
 return NextResponse.json(
 { error: 'Unable to create job' },
 { status: 500 },
 );
 }

 return NextResponse.json({ job }, { status: 201 });
}
