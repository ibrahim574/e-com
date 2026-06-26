import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/account/profile-form";
import { AvatarUploader } from "@/components/account/avatar-uploader";

export const dynamic = "force-dynamic";

export default async function AccountProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/account/login");
  }

  const profile = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      avatarUrl: true,
      phone: true,
      addressLine1: true,
      addressLine2: true,
      addressCity: true,
      addressState: true,
      addressPostal: true,
      addressCountry: true,
    },
  });

  if (!profile) {
    redirect("/account/login");
  }

  return (
    <div className="container-page py-10">
      <div className="mb-6">
        <Link
          href="/account"
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          &larr; Back to account
        </Link>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">My Profile</h1>
        <p className="mt-1 text-sm text-slate-600">
          Keep your contact details and default shipping address up to date.
        </p>
      </div>

      <div className="space-y-6">
        <AvatarUploader
          avatarUrl={profile.avatarUrl}
          name={profile.name}
          email={profile.email}
        />
        <ProfileForm defaults={profile} />
      </div>
    </div>
  );
}
