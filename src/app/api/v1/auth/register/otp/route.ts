import { NextRequest, NextResponse } from "next/server";

import {
  centralAuthRequestRegistrationOtp,
  CentralAuthError,
} from "../../../../../../lib/auth/central-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    const phoneNumber =
      typeof body?.phoneNumber === "string"
        ? body.phoneNumber.trim()
        : "";

    const countryCode =
      typeof body?.countryCode === "string"
        ? body.countryCode.trim()
        : "";

    if (
      !phoneNumber ||
      !countryCode ||
      phoneNumber.length > 30 ||
      countryCode.length > 8
    ) {
      return NextResponse.json(
        { error: "A valid phone number and country code are required." },
        { status: 400 },
      );
    }

    const result = await centralAuthRequestRegistrationOtp(
      phoneNumber,
      countryCode,
    );

    return NextResponse.json({
      challengeId: result.challengeId,
      expiresAt: result.expiresAt,
      browserOtpCode: result.browserOtpCode,
      delivery: result.delivery,
    });
  } catch (error) {
    if (error instanceof CentralAuthError) {
      const status =
        error.status === 429 ? 429 :
        error.status >= 400 && error.status < 500 ? error.status :
        502;

      return NextResponse.json(
        {
          error:
            status === 429
              ? "Too many OTP requests. Please try again later."
              : "Unable to request a registration code.",
        },
        { status },
      );
    }

    console.error("HIREUO registration OTP request failed:", error);

    return NextResponse.json(
      { error: "Unable to request a registration code." },
      { status: 500 },
    );
  }
}
