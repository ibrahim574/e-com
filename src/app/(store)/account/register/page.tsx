"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  loginAction,
  resendOtpAction,
  startRegistrationAction,
  verifyOtpAction,
} from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { passwordPolicyHint } from "@/lib/password-policy";
import { RESEND_COOLDOWN_MS } from "@/lib/otp";

type Step = "details" | "otp";

export default function RegisterPage() {
  const [step, setStep] = useState<Step>("details");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  const [cooldown, setCooldown] = useState(0);
  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (step === "otp") {
      otpInputRef.current?.focus();
    }
  }, [step]);

  function handleStart(formData: FormData) {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const result = await startRegistrationAction(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setStep("otp");
      setCooldown(Math.round(RESEND_COOLDOWN_MS / 1000));
      setInfo(`We sent a 6-digit code to ${email}.`);
    });
  }

  function handleVerify() {
    setError(null);
    if (code.trim().length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    startTransition(async () => {
      const result = await verifyOtpAction(email, code);
      if (result?.error) {
        setError(result.error);
        return;
      }
      // Account created; sign in with the password we still hold from step 1.
      const loginData = new FormData();
      loginData.set("email", email);
      loginData.set("password", password);
      loginData.set("callbackUrl", "/account");
      const loginResult = await loginAction(loginData);
      if (loginResult?.error) {
        // Account exists but auto sign-in failed; send them to login.
        window.location.assign("/account/login");
        return;
      }
      window.location.assign("/account");
    });
  }

  function handleResend() {
    if (cooldown > 0) return;
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const result = await resendOtpAction(email);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setCooldown(Math.round(RESEND_COOLDOWN_MS / 1000));
      setInfo(`A new code was sent to ${email}.`);
    });
  }

  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-10">
      <div className="w-full max-w-md rounded-xl border border-slate-200 p-8">
        {step === "details" ? (
          <>
            <h1 className="text-2xl font-bold">Create Account</h1>
            <p className="mt-1 text-sm text-slate-600">
              We&apos;ll email you a verification code to confirm it&apos;s you.
            </p>
            <form action={handleStart} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <PasswordInput
                  id="password"
                  name="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="mt-1 text-xs text-slate-500">{passwordPolicyHint()}</p>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Sending code..." : "Continue"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link href="/account/login" className="font-semibold text-blue-600">
                Sign In
              </Link>
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold">Verify your email</h1>
            <p className="mt-1 text-sm text-slate-600">
              Enter the 6-digit code we sent to{" "}
              <span className="font-medium text-slate-900">{email}</span>.
            </p>
            <div className="mt-6 space-y-4">
              <div>
                <Label htmlFor="code">Verification code</Label>
                <Input
                  id="code"
                  ref={otpInputRef}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  className="text-center text-lg tracking-[0.5em]"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleVerify();
                  }}
                />
              </div>
              {info && !error && (
                <p className="text-sm text-emerald-600">{info}</p>
              )}
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button
                type="button"
                className="w-full"
                onClick={handleVerify}
                disabled={isPending}
              >
                {isPending ? "Verifying..." : "Verify & Create Account"}
              </Button>
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setStep("details");
                    setError(null);
                    setInfo(null);
                    setCode("");
                  }}
                  className="font-medium text-slate-600 hover:text-slate-900"
                >
                  Change email
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || isPending}
                  className="font-semibold text-blue-600 disabled:text-slate-400"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
