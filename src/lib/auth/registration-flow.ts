import type { CentralAuthRegistrationResult } from "./central-auth";

export type RegistrationInput = {
  phoneNumber: string;
  countryCode: string;
  password: string;
  displayName: string;
};

export async function completeRegistration(
  input: RegistrationInput,
  dependencies: {
    register(input: RegistrationInput): Promise<CentralAuthRegistrationResult>;
    ensureAccount(identity: { id: string; email: string | null }): Promise<{ id: string }>;
  },
) {
  const result = await dependencies.register(input);
  if (
    !result.user?.id ||
    result.user.status !== "pending_google_link" ||
    result.registration?.status !== "pending_google_link" ||
    !result.registration.continuationToken
  ) {
    throw new Error("Central Auth returned an invalid registration response.");
  }

  const account = await dependencies.ensureAccount({ id: result.user.id, email: null });
  return {
    accountId: account.id,
    centralIdentityId: result.user.id,
    continuationToken: result.registration.continuationToken,
    xedruoId: result.user.xedruoId,
  };
}

export async function completeGoogleLink(
  code: string,
  expectedIdentityId: string,
  expectedAccountId: string,
  expectedRegistrationKey: string,
  dependencies: {
    exchange(code: string): Promise<{
      tokens: { accessToken: string; refreshToken: string; expiresIn: number };
      session: { expiresAt: string };
    }>;
    getIdentity(accessToken: string): Promise<{ user: { id: string; email: string | null } }>;
    ensureAccount(identity: { id: string; email: string | null }): Promise<{ id: string }>;
    createSession(input: {
      accountId: string;
      accessToken: string;
      refreshToken: string;
      accessTokenExpiresAt: Date;
      expiresAt: Date;
      userAgent?: string | null;
      idempotencyKey: string;
    }): Promise<void>;
  },
  userAgent?: string | null,
) {
  const result = await dependencies.exchange(code);
  if (!result.tokens?.accessToken || !result.tokens.refreshToken) {
    throw new Error("Central Auth returned an invalid exchange response.");
  }

  const identity = await dependencies.getIdentity(result.tokens.accessToken);
  if (!identity.user?.id || identity.user.id !== expectedIdentityId) {
    throw new Error("Central Auth identity did not match the registration.");
  }

  const account = await dependencies.ensureAccount(identity.user);
  if (account.id !== expectedAccountId) {
    throw new Error("HIREUO account did not match the registration.");
  }
  const expiresAt = new Date(result.session?.expiresAt);
  if (!Number.isFinite(expiresAt.getTime()) || expiresAt <= new Date()) {
    throw new Error("Central Auth returned an invalid session expiry.");
  }

  await dependencies.createSession({
    accountId: account.id,
    accessToken: result.tokens.accessToken,
    refreshToken: result.tokens.refreshToken,
    accessTokenExpiresAt: new Date(Date.now() + result.tokens.expiresIn * 1000),
    expiresAt,
    userAgent,
    idempotencyKey: expectedRegistrationKey,
  });
}
