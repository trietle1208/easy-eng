import "server-only";

export type SendMailInput = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

export type Mailer = {
  send(input: SendMailInput): Promise<void>;
};
