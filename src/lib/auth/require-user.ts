import { redirect } from "next/navigation";

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
  const redirectToAccount = () =>
    redirect("/account?next=" + encodeURIComponent(returnTo));

  const current = await getCurrentSession();

  if (!current) {
    redirectToAccount();
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
