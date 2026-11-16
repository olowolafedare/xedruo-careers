export type RegistrationInput = {
  phoneNumber: string;
  countryCode: string;
  password: string;
  displayName: string;
  email?: string;
};

type CentralTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type RegistrationFlowDependencies = {
  register(input: RegistrationInput): Promise<{
    tokens: CentralTokens;
    session: { expiresAt: string };
  }>;
  getIdentity(accessToken: string): Promise<{
    user: { id: string; email: string | null };
  }>;
  ensureAccount(identity: { id: string; email: string | null }): Promise<{
    id: string;
  }>;
  createSession(input: {
    accountId: string;
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: Date;
    expiresAt: Date;
    userAgent?: string | null;
  }): Promise<void>;
};

export async function completeRegistration(
  input: RegistrationInput,
  dependencies: RegistrationFlowDependencies,
  userAgent?: string | null,
) {
  const result = await dependencies.register(input);
  const identity = await dependencies.getIdentity(result.tokens.accessToken);
  const account = await dependencies.ensureAccount({
    id: identity.user.id,
    email: identity.user.email,
  });

  const expiresAt = new Date(result.session.expiresAt);

  if (!Number.isFinite(expiresAt.getTime()) || expiresAt <= new Date()) {
    throw new Error("Central Auth returned an invalid session expiry.");
  }

  await dependencies.createSession({
    accountId: account.id,
    accessToken: result.tokens.accessToken,
    refreshToken: result.tokens.refreshToken,
    accessTokenExpiresAt: new Date(
      Date.now() + result.tokens.expiresIn * 1000,
    ),
    expiresAt,
    userAgent,
  });
}
