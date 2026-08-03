"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { resendVerificationEmail } from "@/lib/verify-email";

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    if (!email) {
      setError("Missing email address. Go back to registration and try again.");
      return;
    }

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const result = await resendVerificationEmail(email);

      if (!result.ok) {
        setError(result.message);
        setLoading(false);
        return;
      }

      setMessage(result.message);
      setLoading(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center gap-6 px-6 py-16">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink dark:text-paper">
          Check your email
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate">
          We sent a verification link{email ? ` to ${email}` : ""}. Click the link in
          that email to finish creating your account.
        </p>
      </div>

      <div className="rounded-xl border border-slate/15 bg-paper-soft p-4 text-sm text-slate dark:bg-ink-soft">
        The link expires in 24 hours. After verifying, you&apos;ll be signed in
        automatically.
      </div>

      {message && <p className="text-sm text-success">{message}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="button"
        onClick={handleResend}
        disabled={loading || !email}
        className="rounded-full border border-slate/20 px-4 py-2 text-sm font-medium text-ink transition hover:border-brand hover:text-brand disabled:opacity-60 dark:text-paper"
      >
        {loading ? "Sending..." : "Resend verification email"}
      </button>

      <p className="text-center text-sm text-slate">
        Already verified?{" "}
        <Link href="/login" className="text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center px-6 text-sm text-slate">
          Loading...
        </div>
      }
    >
      <CheckEmailContent />
    </Suspense>
  );
}
