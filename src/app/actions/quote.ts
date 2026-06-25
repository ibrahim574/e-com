"use server";

import { prisma } from "@/lib/prisma";
import type { QuoteSubmissionType } from "@prisma/client";
import { getSiteSettings, parseQuoteRecipients } from "@/lib/site-settings";
import { sendEmail } from "@/lib/email";
import {
  fieldsTable,
  quoteConfirmationEmail,
  preOrderConfirmationEmail,
} from "@/lib/email-templates";
import { sanitizeText, sanitizeEmail } from "@/lib/sanitize";
import { EMAIL_BRAND_NAME } from "@/lib/constants";

async function persistQuoteSubmission(data: {
  type: QuoteSubmissionType;
  name: string;
  email: string;
  phone?: string | null;
  productInterest?: string | null;
  quantity?: string | null;
  notes?: string | null;
}) {
  return prisma.quoteSubmission.create({ data });
}

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
    Email: email,
    Phone: phone,
    ...(company ? { Company: company } : {}),
    "Product / Service": productInterest,
    ...(notes ? { "Additional Notes": notes } : {}),
    Submitted: new Date().toLocaleString(),
  };

  const adminHtml = fieldsTable(fields);
  const customer = quoteConfirmationEmail({
    customerName: name,
    companyName: EMAIL_BRAND_NAME,
  });

  const notesCombined = [company ? `Company: ${company}` : null, notes || null]
    .filter(Boolean)
    .join("\n");

  await persistQuoteSubmission({
    type: "STAY_CONNECTED",
    name,
    email,
    phone,
    productInterest,
    notes: notesCombined || null,
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
      subject: `Thanks for reaching out — ${EMAIL_BRAND_NAME}`,
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
    Email: email,
    Phone: phone,
    Product: productName,
    Quantity: quantity,
    ...(notes ? { Notes: notes } : {}),
    Submitted: new Date().toLocaleString(),
  };

  const customer = preOrderConfirmationEmail({
    customerName: name,
    productName,
    companyName: EMAIL_BRAND_NAME,
  });

  await persistQuoteSubmission({
    type: "PREORDER",
    name,
    email,
    phone,
    productInterest: productName,
    quantity,
    notes: notes || null,
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
      subject: `We've received your pre-order request — ${EMAIL_BRAND_NAME}`,
      html: customer.html,
      text: customer.text,
    }),
  ]);

  return { success: true };
}
