"use server";

import { getSiteSettings, parseQuoteRecipients } from "@/lib/site-settings";
import { sendEmail } from "@/lib/email";
import {
  fieldsTable,
  quoteConfirmationEmail,
  preOrderConfirmationEmail,
} from "@/lib/email-templates";
import { sanitizeText, sanitizeEmail } from "@/lib/sanitize";

export async function submitQuoteRequestAction(formData: FormData) {
  const name = sanitizeText(String(formData.get("name") ?? ""));
  const email = sanitizeEmail(String(formData.get("email") ?? ""));
  const phone = sanitizeText(String(formData.get("phone") ?? ""), 30);
  const company = sanitizeText(String(formData.get("company") ?? ""), 200);
  const productInterest = sanitizeText(String(formData.get("productInterest") ?? ""), 2000);
  const notes = sanitizeText(String(formData.get("notes") ?? ""), 2000);

  if (!name || !email || !phone || !productInterest) {
    return { error: "Please fill in all required fields." };
  }

  const settings = await getSiteSettings();
  const recipients = parseQuoteRecipients(settings.quoteRecipients);
  const fields = {
    "Full Name": name,
    "Email": email,
    "Phone": phone,
    ...(company ? { "Company": company } : {}),
    "Product / Service": productInterest,
    ...(notes ? { "Additional Notes": notes } : {}),
    "Submitted": new Date().toLocaleString(),
  };

  const adminHtml = fieldsTable(fields);
  const customer = quoteConfirmationEmail({
    customerName: name,
    companyName: settings.companyName,
  });

  await Promise.all([
    sendEmail({
      to: recipients.length ? recipients : ["service@wirelesscom.ca"],
      subject: `New Quote Request from ${name}`,
      html: adminHtml,
      text: Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join("\n"),
    }),
    sendEmail({
      to: email,
      subject: `Thanks for reaching out — ${settings.companyName}`,
      html: customer.html,
      text: customer.text,
    }),
  ]);

  return { success: true };
}

export async function submitPreOrderAction(formData: FormData) {
  const name = sanitizeText(String(formData.get("name") ?? ""));
  const email = sanitizeEmail(String(formData.get("email") ?? ""));
  const phone = sanitizeText(String(formData.get("phone") ?? ""), 30);
  const productName = sanitizeText(String(formData.get("productName") ?? ""));
  const quantity = String(formData.get("quantity") ?? "");
  const notes = sanitizeText(String(formData.get("notes") ?? ""), 2000);

  if (!name || !email || !phone || !productName || !quantity) {
    return { error: "Please fill in all required fields." };
  }

  const settings = await getSiteSettings();
  const recipients = parseQuoteRecipients(settings.quoteRecipients);
  const fields = {
    "Full Name": name,
    "Email": email,
    "Phone": phone,
    "Product": productName,
    "Quantity": quantity,
    ...(notes ? { "Notes": notes } : {}),
    "Submitted": new Date().toLocaleString(),
  };

  const customer = preOrderConfirmationEmail({
    customerName: name,
    productName,
    companyName: settings.companyName,
  });

  await Promise.all([
    sendEmail({
      to: recipients.length ? recipients : ["service@wirelesscom.ca"],
      subject: `Pre-Order Request: ${productName}`,
      html: fieldsTable(fields),
      text: Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join("\n"),
    }),
    sendEmail({
      to: email,
      subject: `We've received your pre-order request — ${settings.companyName}`,
      html: customer.html,
      text: customer.text,
    }),
  ]);

  return { success: true };
}
