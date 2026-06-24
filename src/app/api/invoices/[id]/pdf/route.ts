import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { order: { include: { user: true } } },
  });

  if (!invoice) {
    return new Response("Not found", { status: 404 });
  }

  const isOwner = invoice.order.userId === session?.user?.id;
  const isAdmin = isAdminRole(session?.user?.role);

  if (!isOwner && !isAdmin) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const buffer = await fs.readFile(invoice.pdfPath);
    return new Response(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch {
    return new Response("File not found", { status: 404 });
  }
}
