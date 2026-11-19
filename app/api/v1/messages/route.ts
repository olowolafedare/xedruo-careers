import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, or } from "drizzle-orm";
import { getDb } from "@/src/lib/db";
import { applications, companyMemberships, jobs, messages, notifications } from "@/src/lib/db/schema";
import { requireApiUser } from "@/src/lib/auth/require-api-user";
import { withCentralAuthErrors } from "@/src/lib/auth/central-auth-response";

export const GET = withCentralAuthErrors(async function GET(request: NextRequest) {
  const current = await requireApiUser();
  if (!current) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const db = getDb();
    const rows = await db.select({
      id: messages.id,
      applicationId: messages.applicationId,
      senderAccountId: messages.senderAccountId,
      recipientAccountId: messages.recipientAccountId,
      body: messages.body,
      readAt: messages.readAt,
      createdAt: messages.createdAt,
      jobTitle: jobs.title,
      candidateAccountId: applications.candidateAccountId,
    }).from(messages)
      .innerJoin(applications, eq(messages.applicationId, applications.id))
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .where(or(eq(messages.senderAccountId, current.account.id), eq(messages.recipientAccountId, current.account.id)))
      .orderBy(desc(messages.createdAt))
      .limit(100);
    const result = rows.map((row) => ({
      ...row,
      counterpartAccountId: row.senderAccountId === current.account.id ? row.recipientAccountId : row.senderAccountId,
      isOwnMessage: row.senderAccountId === current.account.id,
    }));
    return NextResponse.json({ messages: result });
  } catch (error) {
    console.error("Unable to load messages:", error);
    return NextResponse.json({ error: "Unable to load messages" }, { status: 500 });
  }
});

export const POST = withCentralAuthErrors(async function POST(request: NextRequest) {
  const current = await requireApiUser();
  if (!current) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const body = await request.json().catch(() => null) as { applicationId?: unknown; recipientAccountId?: unknown; body?: unknown } | null;
  const applicationId = typeof body?.applicationId === "string" ? body.applicationId : "";
  const recipientAccountId = typeof body?.recipientAccountId === "string" ? body.recipientAccountId : "";
  const messageBody = typeof body?.body === "string" ? body.body.trim() : "";
  if (!applicationId || !recipientAccountId || !messageBody || messageBody.length > 5000) {
    return NextResponse.json({ error: "A valid application, recipient and message (up to 5,000 characters) are required." }, { status: 400 });
  }
  if (recipientAccountId === current.account.id) return NextResponse.json({ error: "You cannot message yourself." }, { status: 400 });
  try {
    const db = getDb();
    const [application] = await db.select({
      id: applications.id,
      candidateAccountId: applications.candidateAccountId,
      companyId: jobs.companyId,
      jobTitle: jobs.title,
    }).from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .where(eq(applications.id, applicationId))
      .limit(1);
    if (!application) return NextResponse.json({ error: "Application not found." }, { status: 404 });

    const senderIsCandidate = application.candidateAccountId === current.account.id;
    const [senderMembership] = await db.select({ id: companyMemberships.id })
      .from(companyMemberships)
      .where(and(
        eq(companyMemberships.companyId, application.companyId),
        eq(companyMemberships.accountId, current.account.id),
        eq(companyMemberships.status, "active"),
      )).limit(1);
    const [recipientMembership] = await db.select({ id: companyMemberships.id })
      .from(companyMemberships)
      .where(and(
        eq(companyMemberships.companyId, application.companyId),
        eq(companyMemberships.accountId, recipientAccountId),
        eq(companyMemberships.status, "active"),
      )).limit(1);

    const authorized = senderIsCandidate
      ? Boolean(recipientMembership)
      : Boolean(senderMembership) && recipientAccountId === application.candidateAccountId;
    if (!authorized) return NextResponse.json({ error: "You are not a participant in this application conversation." }, { status: 403 });

    const [saved] = await db.insert(messages).values({
      applicationId,
      senderAccountId: current.account.id,
      recipientAccountId,
      body: messageBody,
    }).returning({
      id: messages.id,
      applicationId: messages.applicationId,
      senderAccountId: messages.senderAccountId,
      recipientAccountId: messages.recipientAccountId,
      body: messages.body,
      createdAt: messages.createdAt,
    });
    await db.insert(notifications).values({
      accountId: recipientAccountId,
      type: "new_message",
      title: "New message",
      message: `You have a new message about ${application.jobTitle}.`,
      entityType: "application",
      entityId: applicationId,
      actionUrl: "/candidate/messages",
    });
    return NextResponse.json({ message: saved }, { status: 201 });
  } catch (error) {
    console.error("Unable to send message:", error);
    return NextResponse.json({ error: "Unable to send message" }, { status: 500 });
  }
});
