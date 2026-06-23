import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { saveIndustryAction, deleteIndustryAction } from "@/app/actions/admin";

export default async function AdminIndustriesPage() {
  await requireAdmin();

  const industries = await prisma.industry.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <h1 className="text-3xl font-bold">Industries</h1>
        <div className="mt-6 space-y-3">
          {industries.map((industry) => (
            <div
              key={industry.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4"
            >
              <div>
                <p className="font-medium">{industry.name}</p>
                <p className="text-xs text-slate-500">{industry.slug}</p>
              </div>
              <form action={deleteIndustryAction}>
                <input type="hidden" name="id" value={industry.id} />
                <Button variant="ghost" size="sm" type="submit">
                  Delete
                </Button>
              </form>
            </div>
          ))}
        </div>
      </div>

      <form
        action={saveIndustryAction}
        className="h-fit space-y-4 rounded-xl border border-slate-200 bg-white p-6"
      >
        <h2 className="text-xl font-bold">Add Industry</h2>
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required />
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" />
        </div>
        <Button type="submit">Save Industry</Button>
      </form>
    </div>
  );
}
