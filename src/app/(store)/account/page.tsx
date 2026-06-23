import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { isAdminRole } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/account/login");
  }

  const profile = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      addressLine1: true,
      addressCity: true,
      addressState: true,
      addressPostal: true,
      addressCountry: true,
    },
  });

  const hasAddress = !!profile?.addressLine1;

  return (
    <div className="container-page py-10">
      <h1 className="section-title">My Account</h1>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <Link
          href="/account/profile"
          className="rounded-xl border border-slate-200 p-6 transition hover:border-blue-200 hover:shadow-sm"
        >
          <h2 className="font-bold text-slate-900">Profile</h2>
          <p className="mt-2 text-sm text-slate-600">{profile?.name ?? "Customer"}</p>
          <p className="text-sm text-slate-600">{profile?.email}</p>
          {profile?.phone && (
            <p className="mt-1 text-sm text-slate-600">{profile.phone}</p>
          )}
          {hasAddress ? (
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              {profile?.addressLine1}, {profile?.addressCity},{" "}
              {profile?.addressState} {profile?.addressPostal}
            </p>
          ) : (
            <p className="mt-2 text-xs font-medium text-blue-600">
              Add your address &rarr;
            </p>
          )}
        </Link>
        <Link
          href="/account/orders"
          className="rounded-xl border border-slate-200 p-6 transition hover:border-blue-200 hover:shadow-sm"
        >
          <h2 className="font-bold text-slate-900">Order History</h2>
          <p className="mt-2 text-sm text-slate-600">View your past orders and statuses.</p>
        </Link>
        {isAdminRole(session.user.role) && (
          <Link
            href="/admin"
            className="rounded-xl border border-blue-200 bg-blue-50 p-6 transition hover:shadow-sm"
          >
            <h2 className="font-bold text-blue-700">Admin Panel</h2>
            <p className="mt-2 text-sm text-blue-600">Manage products and categories.</p>
          </Link>
        )}
      </div>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
        className="mt-8"
      >
        <Button type="submit" variant="outline">
          Sign Out
        </Button>
      </form>
    </div>
  );
}
