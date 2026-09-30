import "server-only";

import type { Mailer, SendMailInput } from "@/lib/mail/types";

export function createConsoleMailer(): Mailer {
  return {
    async send(input: SendMailInput) {
      console.info("[mail:console]", {
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html ? "(html omitted)" : undefined,
      });
    },
  };
}
