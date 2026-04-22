"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

export function EndpointTester() {
  const router = useRouter();

  const [endpoint, setEndpoint] = useState("");
  const [method, setMethod] = useState<(typeof METHODS)[number]>("GET");
  const [requestBody, setRequestBody] = useState("{}");
  const [requestHeaders, setRequestHeaders] = useState("{}");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!endpoint.trim()) {
      setError("Enter a full HTTPS endpoint URL.");
      return;
    }

    let parsedBody: unknown = undefined;
    let parsedHeaders: Record<string, string> | undefined = undefined;

    if (method !== "GET" && requestBody.trim()) {
      try {
        parsedBody = JSON.parse(requestBody);
      } catch {
        setError("Request body must be valid JSON.");
        return;
      }
    }

    if (requestHeaders.trim()) {
      try {
        parsedHeaders = JSON.parse(requestHeaders) as Record<string, string>;
      } catch {
        setError("Headers must be a valid JSON object.");
        return;
      }
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/test-endpoint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint,
          method,
          body: parsedBody,
          headers: parsedHeaders,
        }),
      });

      const payload = (await response.json()) as { id?: string; error?: string };
      if (!response.ok || !payload.id) {
        throw new Error(payload.error || "Endpoint test failed.");
      }

      router.push(`/report/${payload.id}`);
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : "Endpoint test failed.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Test a Live Endpoint</CardTitle>
        <CardDescription>
          Run active JWT bypass probes against an existing protected API route. We check how your endpoint handles
          unsigned, expired, malformed, and forged tokens.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="endpoint" className="mb-2 block text-sm font-medium text-slate-300">
              Protected endpoint URL
            </label>
            <Input
              id="endpoint"
              value={endpoint}
              onChange={(event) => setEndpoint(event.target.value)}
              placeholder="https://api.example.com/v1/private/profile"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="method" className="mb-2 block text-sm font-medium text-slate-300">
                HTTP method
              </label>
              <select
                id="method"
                value={method}
                onChange={(event) => setMethod(event.target.value as (typeof METHODS)[number])}
                className="h-10 w-full rounded-md border border-slate-700 bg-slate-950/80 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
              >
                {METHODS.map((candidateMethod) => (
                  <option key={candidateMethod} value={candidateMethod}>
                    {candidateMethod}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="headers" className="mb-2 block text-sm font-medium text-slate-300">
                Extra headers (JSON)
              </label>
              <Input
                id="headers"
                value={requestHeaders}
                onChange={(event) => setRequestHeaders(event.target.value)}
                placeholder='{"x-tenant-id":"startup-prod"}'
              />
            </div>
          </div>

          {method !== "GET" ? (
            <div>
              <label htmlFor="body" className="mb-2 block text-sm font-medium text-slate-300">
                Request body (JSON)
              </label>
              <Textarea
                id="body"
                value={requestBody}
                onChange={(event) => setRequestBody(event.target.value)}
                placeholder='{"resource":"billing"}'
              />
            </div>
          ) : null}

          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-sm text-slate-400">
            <p className="flex items-center gap-2 text-slate-300">
              <ShieldAlert className="h-4 w-4 text-cyan-300" />
              Use staging environments when possible. Tests intentionally send invalid JWTs to confirm your auth rejects
              them.
            </p>
          </div>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Run Endpoint Tests
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
