import "server-only";

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

export async function requireApiUser() {
  const current = await getCurrentSession();

  if (!current) return null;

  let accessToken = current.session.accessToken;
  let refreshed = false;

  try {
    if (
      current.session.accessTokenExpiresAt.getTime() <=
      Date.now() + 60_000
    ) {
      const tokens = await centralAuthRefresh(
        current.session.refreshToken,
      );

      await updateSessionTokens({
        sessionId: current.session.id,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      });

      accessToken = tokens.accessToken;
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
        const tokens = await centralAuthRefresh(
          current.session.refreshToken,
        );

        await updateSessionTokens({
          sessionId: current.session.id,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
        });

        accessToken = tokens.accessToken;
        identity = await centralAuthMe(accessToken);
      } else {
        throw error;
      }
    }

    if (identity.user.id !== current.account.xedruoIdentityId) {
      await revokeCurrentSession();
      return null;
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
      return null;
    }

    throw error;
  }
}