import { cache } from "react";
import { prisma } from "@/lib/prisma";

export type InvoiceSettingsData = {
  id: string;
  logoPath: string | null;
  companyName: string;
  companyAddress: string;
  taxNumber: string | null;
  phone: string | null;
  email: string | null;
  footerMessage: string;
  returnPolicy: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
};

export const getInvoiceSettings = cache(async (): Promise<InvoiceSettingsData> => {
  return prisma.invoiceSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
});
