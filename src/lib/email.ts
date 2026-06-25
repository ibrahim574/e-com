import nodemailer, { type Transporter } from "nodemailer";
import { EMAIL_BRAND_NAME, SITE_EMAIL } from "./constants";
import { getSiteSettings } from "./site-settings";
import { decryptSecret } from "./crypto";
import { redactForLog } from "./sanitize";

let cachedTransporter: Transporter | null = null;
let cachedConfigKey: string | null = null;

async function getSmtpConfig() {
  const settings = await getSiteSettings();

  if (settings.smtpHost) {
    let pass: string | undefined;
    if (settings.smtpPasswordEnc) {
      try {
        pass = decryptSecret(settings.smtpPasswordEnc);
      } catch {
        pass = undefined;
      }
    }
    return {
      host: settings.smtpHost,
      port: settings.smtpPort ?? 587,
      secure: settings.smtpSecure || (settings.smtpPort ?? 587) === 465,
      user: settings.smtpUser ?? undefined,
      pass,
      from: settings.smtpFrom ?? undefined,
    };
  }

  const host = process.env.SMTP_HOST;
  if (!host) return null;

  const port = Number(process.env.SMTP_PORT ?? 587);
  return {
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM,
  };
}

async function getTransporter(): Promise<Transporter | null> {
  const config = await getSmtpConfig();
  if (!config) return null;

  const configKey = JSON.stringify({
    host: config.host,
    port: config.port,
    user: config.user,
    from: config.from,
  });

  if (cachedTransporter && cachedConfigKey === configKey) {
    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth:
      config.user && config.pass
        ? { user: config.user, pass: config.pass }
        : undefined,
  });
  cachedConfigKey = configKey;
  return cachedTransporter;
}

async function fromAddress() {
  const settings = await getSiteSettings();
  if (settings.smtpFrom) return settings.smtpFrom;
  return process.env.SMTP_FROM || `${EMAIL_BRAND_NAME} <${SITE_EMAIL}>`;
}

type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
};

export async function sendEmail({ to, subject, html, text }: SendEmailInput) {
  const transporter = await getTransporter();

  if (!transporter) {
    console.info(
      `\n[email] SMTP not configured - logging email instead.\n` +
        `  To: ${Array.isArray(to) ? to.join(", ") : to}\n` +
        `  Subject: ${subject}\n` +
        `  ${text}\n`,
    );
    return;
  }

  await transporter.sendMail({
    from: await fromAddress(),
    to,
    subject,
    text,
    html,
  });
}

type SendEmailWithAttachmentInput = SendEmailInput & {
  attachmentPath: string;
  attachmentName: string;
};

export async function sendEmailWithAttachment({
  to,
  subject,
  html,
  text,
  attachmentPath,
  attachmentName,
}: SendEmailWithAttachmentInput) {
  const transporter = await getTransporter();

  if (!transporter) {
    console.info(
      `\n[email] SMTP not configured - logging email with attachment.\n` +
        `  To: ${Array.isArray(to) ? to.join(", ") : to}\n` +
        `  Subject: ${subject}\n` +
        `  Attachment: ${attachmentName}\n`,
    );
    return;
  }

  await transporter.sendMail({
    from: await fromAddress(),
    to,
    subject,
    text,
    html,
    attachments: [{ filename: attachmentName, path: attachmentPath }],
  });
}

export async function sendTestEmail(to: string) {
  const settings = await getSiteSettings();
  await sendEmail({
    to,
    subject: `Test email from ${EMAIL_BRAND_NAME}`,
    text: `This is a test email from ${EMAIL_BRAND_NAME} admin settings.`,
    html: `<p>This is a test email from <strong>${EMAIL_BRAND_NAME}</strong> admin settings.</p>`,
  });
}

function otpEmailHtml(code: string) {
  return `
  <div style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;padding:32px 16px;">
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
        <div style="background:#1d4ed8;padding:24px 32px;">
          <h1 style="margin:0;color:#ffffff;font-size:18px;font-weight:700;">${EMAIL_BRAND_NAME}</h1>
        </div>
        <div style="padding:32px;">
          <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;">Verify your email</h2>
          <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6;">
            Use the verification code below to finish creating your account. This code expires in 10 minutes.
          </p>
          <div style="text-align:center;margin:0 0 24px;">
            <span style="display:inline-block;font-size:34px;font-weight:700;letter-spacing:10px;color:#1d4ed8;background:#eff6ff;border-radius:12px;padding:16px 24px;">
              ${code}
            </span>
          </div>
          <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      </div>
      <p style="text-align:center;margin:16px 0 0;color:#94a3b8;font-size:12px;">
        &copy; ${new Date().getFullYear()} ${EMAIL_BRAND_NAME}
      </p>
    </div>
  </div>`;
}

export async function sendOtpEmail(to: string, code: string) {
  await sendEmail({
    to,
    subject: `${code} is your ${EMAIL_BRAND_NAME} verification code`,
    text: `Your ${EMAIL_BRAND_NAME} verification code is ${code}. It expires in 10 minutes.`,
    html: otpEmailHtml(code),
  });
}

export function invalidateEmailTransporter() {
  cachedTransporter = null;
  cachedConfigKey = null;
}

export function safeLogEmailContext(context: Record<string, unknown>) {
  console.info("[email]", JSON.stringify(redactForLog(context)));
}
