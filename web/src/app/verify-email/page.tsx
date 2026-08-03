"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getVerificationTokenFromUrl, verifyEmailOnce } from "@/lib/verify-email";

function VerifyEmailContent() {
  const router = useRouter();
  const { applyUser } = useAuth();
  const [error, setError] = useState("");
  /** Stay on the loading screen until we redirect — never flash the error UI on success. */
  const [verifying, setVerifying] = useState(true);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const token = getVerificationTokenFromUrl();

    if (!token) {
      setError("Missing verification token.");
      setVerifying(false);
      return;
    }

    void verifyEmailOnce(token)
      .then(({ ok, data }) => {
        if (!ok || !data.id) {
          setError(data.message || "Verification failed");
          setVerifying(false);
          return;
        }

        applyUser({
          id: data.id,
          email: data.email!,
          name: data.name!,
          phoneNumber: data.phoneNumber ?? null,
          role: data.role!,
        });

        router.replace(data.role === "ADMIN" ? "/admin" : "/");
      })
      .catch(() => {
        setError("Something went wrong. Please try again.");
        setVerifying(false);
      });
  }, [applyUser, router]);

  if (verifying) {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center gap-4 px-6 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink dark:text-paper">
          Verifying your email...
        </h1>
        <p className="text-sm text-slate">Please wait while we confirm your account.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center gap-6 px-6 py-16">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink dark:text-paper">
          Verification failed
        </h1>
        <p className="mt-3 text-sm text-red-500">{error}</p>
      </div>

      <p className="text-sm text-slate">
        Request a new link from the{" "}
        <Link href="/register/check-email" className="text-brand hover:underline">
          check your email
        </Link>{" "}
        page, or{" "}
        <Link href="/register" className="text-brand hover:underline">
          register again
        </Link>
        .
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center px-6 text-sm text-slate">
          Loading...
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
