import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import {
  createExpenseAction,
  deleteExpenseAction,
  updateExpenseAction,
  createExpenseCategoryAction,
} from "@/app/actions/accounting";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ActionForm } from "@/components/ui/action-form";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  await requireAdmin();

  const [expenses, categories] = await Promise.all([
    prisma.expense.findMany({
      include: { category: true },
      orderBy: { expenseDate: "desc" },
      take: 100,
    }),
    prisma.expenseCategory.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalCents = expenses.reduce((s, e) => s + e.amountCents, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Expenses</h1>

      <ActionForm
        action={createExpenseAction}
        successMessage="Expense added."
        className="grid gap-4 rounded-xl border bg-white p-6 sm:grid-cols-2 dark:border-slate-700 dark:bg-slate-900"
      >
        <h2 className="sm:col-span-2 text-lg font-bold">Add Expense</h2>
        <div>
          <Label htmlFor="expenseDate">Date</Label>
          <Input id="expenseDate" name="expenseDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
        </div>
        <div>
          <Label htmlFor="categoryId">Category</Label>
          <select id="categoryId" name="categoryId" required className="w-full rounded-md border px-3 py-2 text-sm">
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Input id="description" name="description" required />
        </div>
        <div>
          <Label htmlFor="amountDollars">Amount ($)</Label>
          <Input id="amountDollars" name="amountDollars" type="number" min="0.01" step="0.01" required />
        </div>
        <div>
          <Label htmlFor="paymentStatus">Payment Status</Label>
          <select id="paymentStatus" name="paymentStatus" className="w-full rounded-md border px-3 py-2 text-sm">
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="attachment">Attachment (optional)</Label>
          <Input id="attachment" name="attachment" type="file" accept=".pdf,.jpg,.jpeg,.png" />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit">Add Expense</Button>
        </div>
      </ActionForm>

      <div className="rounded-xl border bg-white p-4">
        <h3 className="font-bold">Categories</h3>
        <form action={createExpenseCategoryAction} className="mt-2 flex gap-2">
          <Input name="name" placeholder="New category" required />
          <Button type="submit" size="sm">Add</Button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Category</th>
              <th className="p-3">Description</th>
              <th className="p-3 text-right">Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {expenses.map((e) => (
              <tr key={e.id}>
                <td className="p-3">{e.expenseDate.toLocaleDateString()}</td>
                <td className="p-3">{e.category.name}</td>
                <td className="p-3">{e.description}</td>
                <td className="p-3 text-right">{formatPrice(e.amountCents, "CAD")}</td>
                <td className="p-3 capitalize">{e.paymentStatus.toLowerCase().replace("_", " ")}</td>
                <td className="p-3">
                  <details>
                    <summary className="cursor-pointer text-blue-600">Edit</summary>
                    <form action={updateExpenseAction} className="mt-2 grid gap-2 rounded border p-2">
                      <input type="hidden" name="id" value={e.id} />
                      <Input name="expenseDate" type="date" defaultValue={e.expenseDate.toISOString().slice(0, 10)} />
                      <Input name="description" defaultValue={e.description} required />
                      <Input name="amountDollars" type="number" step="0.01" defaultValue={(e.amountCents / 100).toFixed(2)} />
                      <select name="paymentStatus" defaultValue={e.paymentStatus} className="rounded border px-2 py-1 text-sm">
                        <option value="PAID">Paid</option>
                        <option value="PENDING">Pending</option>
                        <option value="PARTIALLY_PAID">Partially Paid</option>
                      </select>
                      <Button type="submit" size="sm">Save</Button>
                    </form>
                  </details>
                  <form action={deleteExpenseAction} className="mt-1">
                    <input type="hidden" name="id" value={e.id} />
                    <Button type="submit" variant="ghost" size="sm" className="text-red-600">Delete</Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 font-bold">
              <td className="p-3" colSpan={3}>Total</td>
              <td className="p-3 text-right">{formatPrice(totalCents, "CAD")}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
