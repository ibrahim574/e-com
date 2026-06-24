import { ResetPasswordForm } from "@/components/account/reset-password-form";

export default async function AdminResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">Admin — Reset password</h1>
        <div className="mt-6">
          <ResetPasswordForm token={token ?? ""} loginHref="/admin/login" />
        </div>
      </div>
    </div>
  );
}
