import { CentralAuthError } from "./central-auth";

type ErrorMessages = Partial<Record<number, string>>;

export function centralAuthErrorResponse(
  error: CentralAuthError,
  messages: ErrorMessages = {},
) {
  const status = error.status >= 400 && error.status <= 599 ? error.status : 502;
  const message =
    messages[status] ??
    (status === 429
      ? "Too many authentication requests Please wait before trying again"
      : status === 401 || status === 403
        ? "Authentication could not be completed Check your credentials and try again"
        : status === 400 || status === 422
          ? "The authentication request could not be completed Check your details and try again"
          : status === 409
            ? "These account details are already in use."
            : "The authentication service is temporarily unavailable Please try again later");

  const headers = new Headers();
  if (error.retryAfter) {
    headers.set("Retry-After", error.retryAfter);
  }
  for (const [name, value] of Object.entries(error.rateLimitHeaders)) {
    headers.set(name, value);
  }

  headers.set("Cache-Control", "no-store");

  return Response.json({ error: message }, { status, headers });
}

export function withCentralAuthErrors<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
): (...args: Args) => Promise<Response> {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof CentralAuthError) {
        return centralAuthErrorResponse(error);
      }

      throw error;
    }
  };
}
