import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { emailInvoiceToCustomer } from "@/lib/invoice/invoice-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { order: true },
  });

  if (!invoice) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = invoice.order.userId === session?.user?.id;
  const dbUser = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      })
    : null;
  const isAdmin = isAdminRole(dbUser?.role);

  if (!isOwner && !isAdmin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const sent = await emailInvoiceToCustomer(id);
  if (!sent) {
    return Response.json({ error: "No email on file" }, { status: 400 });
  }

  return Response.json({ success: true });
}
