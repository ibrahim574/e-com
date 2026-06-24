import { ForgotPasswordForm } from "@/components/account/forgot-password-form";

export default function AdminForgotPasswordPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">Admin — Forgot password</h1>
        <p className="mt-1 text-sm text-slate-600">
          Enter your admin email to receive a reset link.
        </p>
        <div className="mt-6">
          <ForgotPasswordForm admin backHref="/admin/login" />
        </div>
      </div>
    </div>
  );
}
