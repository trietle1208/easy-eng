import "server-only";

import nodemailer from "nodemailer";

import type { Mailer, SendMailInput } from "@/lib/mail/types";

export type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
};

export function createSmtpMailer(config: SmtpConfig): Mailer {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    auth:
      config.user || config.pass
        ? { user: config.user, pass: config.pass }
        : undefined,
  });

  return {
    async send(input: SendMailInput) {
      await transporter.sendMail({
        from: config.from,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      });
    },
  };
}
