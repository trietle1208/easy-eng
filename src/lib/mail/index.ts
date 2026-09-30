import "server-only";

import { env } from "@/env";
import { createConsoleMailer } from "@/lib/mail/console";
import { createSmtpMailer } from "@/lib/mail/smtp";
import type { Mailer } from "@/lib/mail/types";

export type { Mailer, SendMailInput } from "@/lib/mail/types";

let mailer: Mailer | null = null;

export function getMailer(): Mailer {
  if (!mailer) {
    if (env.SMTP_HOST) {
      mailer = createSmtpMailer({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
        from: env.SMTP_FROM || "Easy English <noreply@localhost>",
      });
    } else {
      mailer = createConsoleMailer();
    }
  }
  return mailer;
}
