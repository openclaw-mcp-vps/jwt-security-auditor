"use client";

import { useState } from "react";

import { EndpointTester } from "@/components/endpoint-tester";
import { FileUpload } from "@/components/file-upload";
import { Button } from "@/components/ui/button";

export function AuditConsole() {
  const [mode, setMode] = useState<"files" | "endpoint">("files");

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Button variant={mode === "files" ? "default" : "secondary"} onClick={() => setMode("files")}>
          Scan Code Files
        </Button>
        <Button variant={mode === "endpoint" ? "default" : "secondary"} onClick={() => setMode("endpoint")}>
          Probe Live Endpoint
        </Button>
      </div>

      {mode === "files" ? <FileUpload /> : <EndpointTester />}
    </section>
  );
}
