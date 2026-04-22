"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LockOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function UnlockAccessForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!email.trim()) {
      setError("Enter the same email used during checkout.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/access/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const payload = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Unable to unlock access.");
      }

      setMessage("Access unlocked for this browser. Redirecting to the audit workspace...");
      router.refresh();
    } catch (submitError) {
      const messageText = submitError instanceof Error ? submitError.message : "Unable to unlock access.";
      setError(messageText);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label htmlFor="unlock-email" className="block text-sm font-medium text-slate-300">
        Purchased email address
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          id="unlock-email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          placeholder="you@company.com"
          required
        />
        <Button type="submit" disabled={isSubmitting} className="sm:min-w-48">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockOpen className="h-4 w-4" />}
          Unlock Workspace
        </Button>
      </div>
      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </form>
  );
}
