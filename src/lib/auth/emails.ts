import "server-only";

type VerifyEmailParams = {
  name: string;
  url: string;
};

type ResetPasswordParams = {
  name: string;
  url: string;
};

export function verificationEmail({ name, url }: VerifyEmailParams) {
  const subject = "Verify your Easy English email · Xác nhận email";
  const text = [
    `Hi ${name},`,
    "",
    "Welcome to Easy English! Please verify your email:",
    url,
    "",
    "—",
    `Chào ${name},`,
    "",
    "Chào mừng bạn đến Easy English! Hãy xác nhận email:",
    url,
    "",
    "If you didn’t create an account, you can ignore this message.",
    "Nếu bạn không tạo tài khoản, hãy bỏ qua email này.",
  ].join("\n");

  const html = `
    <p>Hi <strong>${escapeHtml(name)}</strong>,</p>
    <p>Welcome to Easy English! Please verify your email:</p>
    <p><a href="${escapeAttr(url)}">${escapeHtml(url)}</a></p>
    <hr />
    <p>Chào <strong>${escapeHtml(name)}</strong>,</p>
    <p>Chào mừng bạn đến Easy English! Hãy xác nhận email:</p>
    <p><a href="${escapeAttr(url)}">${escapeHtml(url)}</a></p>
    <p style="color:#666;font-size:13px">If you didn’t create an account, ignore this message. / Nếu bạn không tạo tài khoản, hãy bỏ qua email này.</p>
  `;

  return { subject, text, html };
}

export function resetPasswordEmail({ name, url }: ResetPasswordParams) {
  const subject = "Reset your Easy English password · Đặt lại mật khẩu";
  const text = [
    `Hi ${name},`,
    "",
    "Reset your password with this link (expires soon):",
    url,
    "",
    "—",
    `Chào ${name},`,
    "",
    "Đặt lại mật khẩu bằng liên kết này (sẽ hết hạn sớm):",
    url,
    "",
    "If you didn’t ask for a reset, you can ignore this message.",
    "Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.",
  ].join("\n");

  const html = `
    <p>Hi <strong>${escapeHtml(name)}</strong>,</p>
    <p>Reset your password with this link (expires soon):</p>
    <p><a href="${escapeAttr(url)}">${escapeHtml(url)}</a></p>
    <hr />
    <p>Chào <strong>${escapeHtml(name)}</strong>,</p>
    <p>Đặt lại mật khẩu bằng liên kết này (sẽ hết hạn sớm):</p>
    <p><a href="${escapeAttr(url)}">${escapeHtml(url)}</a></p>
    <p style="color:#666;font-size:13px">If you didn’t ask for a reset, ignore this message. / Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
  `;

  return { subject, text, html };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string) {
  return escapeHtml(s).replace(/'/g, "&#39;");
}
