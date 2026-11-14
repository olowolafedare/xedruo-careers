
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";

import { getDb } from "../../../../../lib/db";
import {
  candidateDocuments,
} from "../../../../../lib/db/schema";
import { requireApiUser } from "../../../../../lib/auth/require-api-user";
import {
  uploadPrivateFile,
  createPrivateFileUrl,
  deletePrivateFile,
} from "../../../../../lib/storage/r2";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = {
  pdf: {
    mime: "application/pdf",
    extension: "pdf",
  },
  doc: {
    mime: "application/msword",
    extension: "doc",
  },
  docx: {
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extension: "docx",
  },
} as const;

type ResumeExtension = keyof typeof ALLOWED_TYPES;

function detectResumeType(
  filename: string,
  mimeType: string,
  bytes: Buffer,
): ResumeExtension | null {
  const extension = filename.split(".").pop()?.toLowerCase();

  if (!extension || !(extension in ALLOWED_TYPES)) {
    return null;
  }

  const type = extension as ResumeExtension;
  const expectedMime = ALLOWED_TYPES[type].mime;

  if (
    mimeType &&
    mimeType !== expectedMime &&
    mimeType !== "application/octet-stream"
  ) {
    return null;
  }

  if (type === "pdf") {
    return bytes.subarray(0, 5).toString("ascii") === "%PDF-"
      ? type
      : null;
  }

  if (type === "doc") {
    const signature = Buffer.from([
      0xd0, 0xcf, 0x11, 0xe0,
      0xa1, 0xb1, 0x1a, 0xe1,
    ]);

    return bytes.subarray(0, 8).equals(signature) ? type : null;
  }

  // DOCX files are ZIP archives.
  const isZip =
    bytes.length >= 4 &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    [0x03, 0x05, 0x07].includes(bytes[2]) &&
    [0x04, 0x06, 0x08].includes(bytes[3]);

  return isZip ? type : null;
}

export async function POST(request: NextRequest) {
  let uploadedKey: string | null = null;

  try {
    const auth = await requireApiUser();

    if (!auth) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("resume");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please select a resume file." },
        { status: 400 },
      );
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Resume must be between 1 byte and 5 MB." },
        { status: 400 },
      );
    }

    const originalName = file.name.trim();

    if (
      !originalName ||
      originalName.length > 255 ||
      /[/\\\0]/.test(originalName)
    ) {
      return NextResponse.json(
        { error: "Invalid resume filename." },
        { status: 400 },
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    const type = detectResumeType(
      originalName,
      file.type,
      bytes,
    );

    if (!type) {
      return NextResponse.json(
        { error: "Only valid PDF, DOC, and DOCX resumes are accepted." },
        { status: 400 },
      );
    }

    const objectKey =
      `candidate-resumes/${auth.account.id}/${randomUUID()}.${type}`;

    await uploadPrivateFile({
      key: objectKey,
      body: bytes,
      contentType: ALLOWED_TYPES[type].mime,
    });

    uploadedKey = objectKey;

    const db = getDb();

    const [document] = await db
      .insert(candidateDocuments)
      .values({
        accountId: auth.account.id,
        documentType: "resume",
        originalName,
        objectKey,
        mimeType: ALLOWED_TYPES[type].mime,
        sizeBytes: file.size,
      })
      .returning({
        id: candidateDocuments.id,
        originalName: candidateDocuments.originalName,
        mimeType: candidateDocuments.mimeType,
        sizeBytes: candidateDocuments.sizeBytes,
        createdAt: candidateDocuments.createdAt,
      });

    return NextResponse.json(
      {
        success: true,
        document,
      },
      { status: 201 },
    );
  } catch (error) {
    if (uploadedKey) {
      try {
        await deletePrivateFile(uploadedKey);
      } catch (cleanupError) {
        console.error("R2 orphan cleanup failed:", cleanupError);
      }
    }

    console.error("Candidate resume upload failed:", error);

    return NextResponse.json(
      { error: "Unable to upload resume. Please try again." },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const auth = await requireApiUser();

    if (!auth) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const db = getDb();

    const [document] = await db
      .select()
      .from(candidateDocuments)
      .where(
        and(
          eq(candidateDocuments.accountId, auth.account.id),
          eq(candidateDocuments.documentType, "resume"),
        ),
      )
      .orderBy(desc(candidateDocuments.createdAt))
      .limit(1);

    if (!document) {
      return NextResponse.json({
        success: true,
        resume: null,
      });
    }

    const url = await createPrivateFileUrl(document.objectKey);

    return NextResponse.json({
      success: true,
      resume: {
        id: document.id,
        originalName: document.originalName,
        mimeType: document.mimeType,
        sizeBytes: document.sizeBytes,
        url,
      },
    });
  } catch (error) {
    console.error("Candidate resume retrieval failed:", error);

    return NextResponse.json(
      { error: "Unable to retrieve resume." },
      { status: 500 },
    );
  }
}
