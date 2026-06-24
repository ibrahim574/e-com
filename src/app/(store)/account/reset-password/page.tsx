import { ResetPasswordForm } from "@/components/account/reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-10">
      <div className="w-full max-w-md rounded-xl border border-slate-200 p-8">
        <h1 className="text-2xl font-bold">Reset password</h1>
        <div className="mt-6">
          <ResetPasswordForm token={token ?? ""} loginHref="/account/login" />
        </div>
      </div>
    </div>
  );
}
