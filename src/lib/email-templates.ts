import { escapeHtml } from "./sanitize";

type EmailLayoutVars = {
  companyName: string;
  bodyHtml: string;
};

export function emailLayout({ companyName, bodyHtml }: EmailLayoutVars): string {
  return `
  <div style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
        <div style="background:#1d4ed8;padding:24px 32px;">
          <h1 style="margin:0;color:#ffffff;font-size:18px;font-weight:700;">${escapeHtml(companyName)}</h1>
        </div>
        <div style="padding:32px;">
          ${bodyHtml}
        </div>
      </div>
      <p style="text-align:center;margin:16px 0 0;color:#94a3b8;font-size:12px;">
        &copy; ${new Date().getFullYear()} ${escapeHtml(companyName)}
      </p>
    </div>
  </div>`;
}

export function fieldsTable(fields: Record<string, string>): string {
  const rows = Object.entries(fields)
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;color:#475569;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:8px 12px;border:1px solid #e2e8f0;color:#0f172a;">${escapeHtml(value)}</td></tr>`,
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;">${rows}</table>`;
}

type OrderEmailVars = {
  customerName: string;
  orderNumber: string;
  orderTotal: string;
  orderSummary: string;
  changeDescription: string;
  companyName: string;
  productName?: string;
};

export function orderUpdateEmail(vars: OrderEmailVars): { html: string; text: string } {
  const bodyHtml = `
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;">Order Update</h2>
    <p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.6;">
      Hi ${escapeHtml(vars.customerName)},
    </p>
    <p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.6;">
      ${escapeHtml(vars.changeDescription)}
    </p>
    <p style="margin:0 0 8px;color:#0f172a;font-size:14px;font-weight:600;">Order #${escapeHtml(vars.orderNumber)}</p>
    ${vars.orderSummary}
    <p style="margin:16px 0 0;color:#0f172a;font-size:14px;font-weight:600;">New total: ${escapeHtml(vars.orderTotal)}</p>
    <p style="margin:16px 0 0;color:#94a3b8;font-size:12px;line-height:1.6;">
      If this change was unexpected, please contact our support team.
    </p>`;

  const text = [
    `Hi ${vars.customerName},`,
    vars.changeDescription,
    `Order #${vars.orderNumber}`,
    `New total: ${vars.orderTotal}`,
    "If this change was unexpected, please contact our support team.",
  ].join("\n\n");

  return { html: emailLayout({ companyName: vars.companyName, bodyHtml }), text };
}

export function quoteConfirmationEmail(vars: {
  customerName: string;
  companyName: string;
}): { html: string; text: string } {
  const bodyHtml = `
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;">Thanks for reaching out</h2>
    <p style="margin:0;color:#475569;font-size:14px;line-height:1.6;">
      Thank you for your interest, ${escapeHtml(vars.customerName)}! We've received your request and will be in touch with you soon. We appreciate you staying connected with ${escapeHtml(vars.companyName)}.
    </p>`;
  const text = `Thank you for your interest! We've received your request and will be in touch with you soon. We appreciate you staying connected with ${vars.companyName}.`;
  return { html: emailLayout({ companyName: vars.companyName, bodyHtml }), text };
}

export function preOrderConfirmationEmail(vars: {
  customerName: string;
  productName: string;
  companyName: string;
}): { html: string; text: string } {
  const bodyHtml = `
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;">Pre-order request received</h2>
    <p style="margin:0;color:#475569;font-size:14px;line-height:1.6;">
      Thank you for your pre-order request for <strong>${escapeHtml(vars.productName)}</strong>, ${escapeHtml(vars.customerName)}. Our team will review availability and reach out to you shortly.
    </p>`;
  const text = `Thank you for your pre-order request for ${vars.productName}. Our team will review availability and reach out to you shortly.`;
  return { html: emailLayout({ companyName: vars.companyName, bodyHtml }), text };
}

export function buildOrderSummaryTable(
  items: Array<{ name: string; qty: number; price: string }>,
): string {
  const rows = items
    .map(
      (item) =>
        `<tr><td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;">${escapeHtml(item.name)}</td><td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:center;">${item.qty}</td><td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">${escapeHtml(item.price)}</td></tr>`,
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:8px;"><thead><tr><th style="text-align:left;padding:6px 8px;color:#64748b;">Item</th><th style="padding:6px 8px;color:#64748b;">Qty</th><th style="text-align:right;padding:6px 8px;color:#64748b;">Price</th></tr></thead><tbody>${rows}</tbody></table>`;
}

export function invoiceEmail(vars: {
  customerName: string;
  orderNumber: string;
  invoiceNumber: string;
  companyName: string;
}): { html: string; text: string } {
  const bodyHtml = `
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;">Your Invoice</h2>
    <p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.6;">
      Hi ${escapeHtml(vars.customerName)}, please find your invoice attached for order #${escapeHtml(vars.orderNumber)}.
    </p>
    <p style="margin:0;color:#0f172a;font-size:14px;font-weight:600;">Invoice #${escapeHtml(vars.invoiceNumber)}</p>`;
  const text = `Hi ${vars.customerName}, your invoice ${vars.invoiceNumber} for order #${vars.orderNumber} is attached.`;
  return { html: emailLayout({ companyName: vars.companyName, bodyHtml }), text };
}

export function refundEmail(vars: {
  customerName: string;
  orderNumber: string;
  refundAmount: string;
  companyName: string;
}): { html: string; text: string } {
  const bodyHtml = `
    <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;">Your refund has been processed</h2>
    <p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.6;">
      Hi ${escapeHtml(vars.customerName)}, a refund of ${escapeHtml(vars.refundAmount)} has been processed for order #${escapeHtml(vars.orderNumber)}.
    </p>
    <p style="margin:0;color:#64748b;font-size:13px;">Please allow 3–5 business days for the refund to appear on your statement.</p>`;
  const text = `Hi ${vars.customerName}, a refund of ${vars.refundAmount} has been processed for order #${vars.orderNumber}. Please allow 3–5 business days.`;
  return { html: emailLayout({ companyName: vars.companyName, bodyHtml }), text };
}

export { parseVideoEmbedUrl } from "./video";
