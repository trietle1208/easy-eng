export const NAV_ITEMS = [
  {
    key: "grammar",
    href: "/grammar",
    label: "Grammar",
    mobileLabel: "Grammar",
  },
  {
    key: "vocabulary",
    href: "/vocabulary",
    label: "Vocabulary",
    mobileLabel: "Words",
  },
  {
    key: "reading",
    href: "/reading",
    label: "Reading",
    mobileLabel: "Reading",
  },
  {
    key: "listening",
    href: "/listening",
    label: "Listening",
    mobileLabel: "Listening",
  },
] as const;

export type NavKey = (typeof NAV_ITEMS)[number]["key"] | "home" | "profile";

/** First content slugs used by redirect pages / quiz placeholders. */
export const SAMPLE_QUIZ_SLUG = "present-perfect-vs-past-simple";
