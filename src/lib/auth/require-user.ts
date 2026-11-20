import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { ensureLocalAccount } from "./account-store";

const RENDER_PREVIEW_HOST = "xedruo-career-preview.onrender.com";
const RENDER_PREVIEW_IDENTITY = "render-preview-demo-identity";

import {
  centralAuthMe,
  centralAuthRefresh,
  CentralAuthError,
} from "./central-auth";

import {
  getCurrentSession,
  updateSessionTokens,
  revokeCurrentSession,
} from "./session-store";

async function refreshSession(session: {
  id: string;
  refreshToken: string;
}) {
  const tokens = await centralAuthRefresh(session.refreshToken);

  await updateSessionTokens({
    sessionId: session.id,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
  });

  return tokens.accessToken;
}

export async function requireUser(returnTo = "/start") {
  // Dedicated, isolated Render preview only: deliberately bypass Xedruo
  // Central Auth and session cookies so reviewers can inspect the product.
  const requestHeaders = await headers();
  const previewHost = requestHeaders.get("host")?.split(":")[0]?.toLowerCase();
  if (
    process.env.HIREUO_RENDER_PREVIEW_AUTH === "true" &&
    previewHost === RENDER_PREVIEW_HOST
  ) {
    const account = await ensureLocalAccount({ id: RENDER_PREVIEW_IDENTITY });
    return {
      account,
      user: { id: account.xedruoIdentityId, email: account.email ?? null },
      session: { id: "render-preview-session", expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000) },
    };
  }
    const redirectToAccount = (): never => {
    redirect("/account?next=" + encodeURIComponent(returnTo));
    };

  const current = await getCurrentSession();

    if (!current) {
    return redirectToAccount();
    }

  if (current.session.authMode === "local_application_google") {
    return {
      account: current.account,
      user: {
        id: current.account.xedruoIdentityId,
        email: current.account.email ?? null,
      },
      session: {
        id: current.session.id,
        expiresAt: current.session.expiresAt,
      },
    };
  }

  if (!current.session.accessToken || !current.session.refreshToken || !current.session.accessTokenExpiresAt) {
    await revokeCurrentSession();
    return redirectToAccount();
  }

  let accessToken = current.session.accessToken;
  let refreshed = false;

  try {
    // Refresh shortly before expiry to avoid using an expired token.
    if (
      current.session.accessTokenExpiresAt.getTime() <=
      Date.now() + 60_000
    ) {
      accessToken = await refreshSession({
        id: current.session.id,
        refreshToken: current.session.refreshToken,
      });
      refreshed = true;
    }

    let identity;

    try {
      identity = await centralAuthMe(accessToken);
    } catch (error) {

      if (
        error instanceof CentralAuthError &&
        error.status === 401 &&
        !refreshed
      ) {
        accessToken = await refreshSession({
          id: current.session.id,
          refreshToken: current.session.refreshToken,
        });

        identity = await centralAuthMe(accessToken);
      } else {
        throw error;
      }
    }

    if (identity.user.id !== current.account.xedruoIdentityId) {
      await revokeCurrentSession();
      redirectToAccount();
    }

    return {
      account: current.account,
      user: identity.user,
      session: {
        id: current.session.id,
        expiresAt: current.session.expiresAt,
      },
    };
  } catch (error) {
    if (
      error instanceof CentralAuthError &&
      (error.status === 401 || error.status === 403)
    ) {
      await revokeCurrentSession();
      redirectToAccount();
    }
    throw error;
  }
}
