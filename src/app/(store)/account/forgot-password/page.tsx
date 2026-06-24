import { ForgotPasswordForm } from "@/components/account/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-10">
      <div className="w-full max-w-md rounded-xl border border-slate-200 p-8">
        <h1 className="text-2xl font-bold">Forgot password</h1>
        <p className="mt-1 text-sm text-slate-600">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
        <div className="mt-6">
          <ForgotPasswordForm backHref="/account/login" />
        </div>
      </div>
    </div>
  );
}
