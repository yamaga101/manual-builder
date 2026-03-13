"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { importRecording } from "@/lib/import/recording-import";
import type { RecordingPayload } from "@/types/recording";

export function ImportButton() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const router = useRouter();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const json = JSON.parse(text);

      // Validate payload shape
      if (json.type !== "MANUAL_BUILDER_IMPORT" || !Array.isArray(json.steps)) {
        throw new Error("Invalid recording file format");
      }

      const payload: RecordingPayload = {
        type: "MANUAL_BUILDER_IMPORT",
        version: 1,
        title: json.title ?? file.name.replace(/\.json$/, ""),
        steps: json.steps,
      };

      const { documentId } = await importRecording(payload);
      router.push(`/editor#${documentId}`);
    } catch (err) {
      console.error("[manual-builder] JSON import failed:", err);
      alert("インポートに失敗しました。ファイル形式を確認してください。");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        variant="outline"
        disabled={importing}
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="h-4 w-4 mr-2" />
        {importing ? "Importing..." : "Import Recording"}
      </Button>
    </>
  );
}
