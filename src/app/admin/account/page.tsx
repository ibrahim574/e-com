import { requireAdmin } from "@/lib/admin-guard";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminAccountPage() {
  const session = await requireAdmin();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          My Admin Account
        </h1>
        <p className="mt-1 text-slate-600">{session.user.email}</p>
        <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
          Role: {session.user.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
        </p>
      </div>

      <ChangePasswordForm />

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/admin/login" });
        }}
      >
        <Button type="submit" variant="outline">
          Sign out
        </Button>
      </form>
    </div>
  );
}
