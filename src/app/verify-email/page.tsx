"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found.");
      return;
    }

    const verify = async () => {
      try {
        const res = await api.get(`/auth/verify-email?token=${token}`);
        setStatus("success");
        setMessage(res.data.message);
        // Redirect to login after 5 seconds
        setTimeout(() => router.push("/login"), 5000);
      } catch (err: any) {
        setStatus("error");
        setMessage(err.response?.data?.error || "Verification failed. The link may be expired.");
      }
    };

    verify();
  }, [token, router]);

  return (
    <div className="text-center">
      {status === "loading" && (
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={48} className="text-primary animate-spin" />
          <h1 className="text-2xl font-bold text-white">Verifying your email...</h1>
          <p className="text-gray-400">Please wait while we confirm your address.</p>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-500">
          <CheckCircle2 size={64} className="text-green-500" />
          <h1 className="text-3xl font-black text-white">Email Verified!</h1>
          <p className="text-gray-400 max-w-xs mx-auto">{message}</p>
          <p className="text-xs text-primary mt-4">Redirecting you to login in a few seconds...</p>
          <Link href="/login" className="mt-6 bg-primary text-dark font-bold px-8 py-3 rounded-xl hover:scale-105 transition-transform">
            Go to Login Now
          </Link>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-4 animate-in fade-in">
          <XCircle size={64} className="text-red-500" />
          <h1 className="text-3xl font-black text-white">Verification Failed</h1>
          <p className="text-gray-400 max-w-xs mx-auto">{message}</p>
          <Link href="/login" className="mt-6 text-primary font-bold hover:underline">
            Back to Login
          </Link>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D1B2A] p-4 font-inter">
      <div className="w-full max-w-md bg-[#1B2838] rounded-3xl p-10 border border-white/10 shadow-2xl">
        <Suspense fallback={<div className="flex justify-center"><Loader2 className="animate-spin text-primary" /></div>}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
