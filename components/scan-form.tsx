"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const scanSchema = z
  .object({
    token: z.string().trim().optional(),
    endpoint: z.string().trim().url("Enter a valid endpoint URL").optional(),
    expectedIssuer: z.string().trim().optional(),
    expectedAudience: z.string().trim().optional(),
    expectedAlgorithm: z.string().trim().optional()
  })
  .refine((data) => Boolean(data.token || data.endpoint), {
    message: "Provide at least a JWT token or an auth endpoint URL.",
    path: ["token"]
  });

type ScanFormValues = z.infer<typeof scanSchema>;

export function ScanForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<ScanFormValues>({
    resolver: zodResolver(scanSchema),
    defaultValues: {
      token: "",
      endpoint: "",
      expectedIssuer: "",
      expectedAudience: "",
      expectedAlgorithm: ""
    }
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: ScanFormValues) {
    setServerError(null);
    const response = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });

    const payload = (await response.json()) as { error?: string; reportId?: string };

    if (!response.ok || !payload.reportId) {
      setServerError(payload.error ?? "Scan failed. Please retry.");
      return;
    }

    router.push(`/report/${payload.reportId}`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Run JWT Security Scan</CardTitle>
        <CardDescription>
          Paste a production-like JWT and/or an auth-protected endpoint to run automated abuse-case tests.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <label htmlFor="token" className="text-sm text-[#9da7b3]">
              JWT token (optional)
            </label>
            <Textarea id="token" placeholder="eyJhbGciOi..." {...form.register("token")} />
          </div>

          <div className="space-y-2">
            <label htmlFor="endpoint" className="text-sm text-[#9da7b3]">
              Protected endpoint URL (optional)
            </label>
            <Input id="endpoint" placeholder="https://api.example.com/v1/me" {...form.register("endpoint")} />
            {form.formState.errors.endpoint ? (
              <p className="text-sm text-[#f85149]">{form.formState.errors.endpoint.message}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label htmlFor="issuer" className="text-sm text-[#9da7b3]">
                Expected issuer
              </label>
              <Input id="issuer" placeholder="https://auth.example.com" {...form.register("expectedIssuer")} />
            </div>
            <div className="space-y-2">
              <label htmlFor="audience" className="text-sm text-[#9da7b3]">
                Expected audience
              </label>
              <Input id="audience" placeholder="api://my-service" {...form.register("expectedAudience")} />
            </div>
            <div className="space-y-2">
              <label htmlFor="algorithm" className="text-sm text-[#9da7b3]">
                Expected algorithm
              </label>
              <Input id="algorithm" placeholder="RS256" {...form.register("expectedAlgorithm")} />
            </div>
          </div>

          {form.formState.errors.token ? (
            <p className="text-sm text-[#f85149]">{form.formState.errors.token.message}</p>
          ) : null}

          {serverError ? <p className="text-sm text-[#f85149]">{serverError}</p> : null}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Scan Implementation"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
