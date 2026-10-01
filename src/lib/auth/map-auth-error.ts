type AuthErrorLike = {
  message?: string | null;
  status?: number | null;
  code?: string | null;
};

const MESSAGE_MAP: Array<{ match: RegExp; message: string }> = [
  {
    match: /invalid origin|untrusted origin|csrf|forbidden origin/i,
    message: "Something went wrong on our side. Please refresh and try again.",
  },
  {
    match: /user already exists|email.*already|already registered/i,
    message: "An account with this email already exists. Try signing in instead.",
  },
  {
    match: /invalid email or password|invalid credentials|incorrect.*password/i,
    message: "That email or password doesn’t look right. Try again?",
  },
  {
    match: /email.*(not verified|unverified)|verify your email/i,
    message: "Please verify your email first — open the link we sent to your inbox.",
  },
  {
    match: /too many|rate limit|try again later/i,
    message: "Too many attempts — wait a minute, then try again.",
  },
  {
    match: /password.*(short|least|weak|min)/i,
    message: "Use at least 8 characters for your password.",
  },
  {
    match: /invalid.*(token|link)|expired|reset.*token/i,
    message: "That link isn’t valid anymore. Request a new one and try again.",
  },
];

/** Technical / internal strings we never show to end users. */
const TECHNICAL =
  /origin|csrf|cors|token|sql|drizzle|exception|stack|ECONN|ENOENT|internal|unauthorized|forbidden|bad request|failed to fetch|network error|fetch failed/i;

/**
 * Map Better Auth / network errors to short, user-facing copy.
 * Never surface raw API strings like "Invalid origin".
 */
export function mapAuthError(
  error: AuthErrorLike | null | undefined,
  fallback: string,
): string {
  const raw = (error?.message ?? "").trim();
  if (!raw) return fallback;

  for (const { match, message } of MESSAGE_MAP) {
    if (match.test(raw)) return message;
  }

  if (TECHNICAL.test(raw)) return fallback;

  // Short Title Case API labels ("Invalid Origin") — not helpful to users.
  if (raw.length <= 40 && !/[.!?']/.test(raw) && /^[A-Z][\w\s-]*$/.test(raw)) {
    return fallback;
  }

  return raw;
}
