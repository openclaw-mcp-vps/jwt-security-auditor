"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileCode2, Loader2, UploadCloud, X } from "lucide-react";
import { useDropzone } from "react-dropzone";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface LocalFile {
  name: string;
  size: number;
  content: string;
}

const MAX_FILES = 40;
const MAX_FILE_SIZE = 2 * 1024 * 1024;

export function FileUpload() {
  const router = useRouter();
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onDrop = async (acceptedFiles: File[]) => {
    setError(null);

    if (files.length + acceptedFiles.length > MAX_FILES) {
      setError(`Upload up to ${MAX_FILES} files per scan.`);
      return;
    }

    const oversized = acceptedFiles.find((file) => file.size > MAX_FILE_SIZE);
    if (oversized) {
      setError(`File ${oversized.name} exceeds 2MB.`);
      return;
    }

    const loaded = await Promise.all(
      acceptedFiles.map(async (file) => ({
        name: file.name,
        size: file.size,
        content: await file.text(),
      })),
    );

    setFiles((current) => {
      const merged = [...current, ...loaded];
      const unique = merged.filter(
        (item, index, all) => all.findIndex((candidate) => candidate.name === item.name) === index,
      );
      return unique;
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    maxSize: MAX_FILE_SIZE,
    accept: {
      "text/plain": [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".go", ".py", ".java", ".rb"],
    },
  });

  const totalKb = useMemo(
    () => Math.round(files.reduce((sum, file) => sum + file.size, 0) / 1024),
    [files],
  );

  async function handleAnalyze() {
    if (files.length === 0) {
      setError("Upload at least one auth-related source file.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ files }),
      });

      const payload = (await response.json()) as { id?: string; error?: string };
      if (!response.ok || !payload.id) {
        throw new Error(payload.error || "Analysis failed.");
      }

      router.push(`/report/${payload.id}`);
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : "Analysis failed.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Analyze Code Files</CardTitle>
        <CardDescription>
          Drop your auth middleware, token helpers, and login controllers. The scanner flags algorithm confusion,
          expiration bypasses, weak secret usage, and claim validation gaps.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          {...getRootProps()}
          className={`cursor-pointer rounded-xl border border-dashed p-6 transition-colors ${
            isDragActive ? "border-cyan-400 bg-cyan-400/10" : "border-slate-700 bg-slate-950/60"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3 text-center">
            <UploadCloud className="h-8 w-8 text-cyan-300" />
            <p className="text-sm text-slate-200">
              {isDragActive
                ? "Drop files to queue the security scan"
                : "Drag and drop auth files, or click to choose files"}
            </p>
            <p className="text-xs text-slate-500">Supported: TS/JS/JSON and backend source files up to 2MB each.</p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
          <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
            <span>{files.length} files selected</span>
            <span>{totalKb} KB total</span>
          </div>

          <div className="max-h-48 space-y-2 overflow-auto pr-2">
            {files.length === 0 ? (
              <p className="text-sm text-slate-500">No files added yet.</p>
            ) : (
              files.map((file) => (
                <div key={file.name} className="flex items-center justify-between rounded-md bg-slate-900/80 px-3 py-2">
                  <div className="flex items-center gap-2 text-sm text-slate-200">
                    <FileCode2 className="h-4 w-4 text-cyan-300" />
                    <span>{file.name}</span>
                    <span className="text-xs text-slate-500">{Math.round(file.size / 1024)} KB</span>
                  </div>
                  <button
                    type="button"
                    className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-200"
                    onClick={() => setFiles((current) => current.filter((candidate) => candidate.name !== file.name))}
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        <div className="flex flex-wrap gap-3">
          <Button onClick={handleAnalyze} disabled={isSubmitting || files.length === 0}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Run JWT Audit
          </Button>
          <Button variant="secondary" onClick={() => setFiles([])} disabled={isSubmitting || files.length === 0}>
            Clear Files
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
