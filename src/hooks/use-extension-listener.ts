"use client";

import { useEffect, useCallback } from "react";
import type { RecordingPayload } from "@/types/recording";
import { importRecording } from "@/lib/import/recording-import";

export function useExtensionListener(
  enabled: boolean,
  onImportComplete: (documentId: string) => void,
) {
  const handleMessage = useCallback(
    async (event: MessageEvent) => {
      const data = event.data;
      if (data?.type !== "MANUAL_BUILDER_IMPORT" || data?.version !== 1) return;

      try {
        const payload = data as RecordingPayload;
        const { documentId } = await importRecording(payload);
        onImportComplete(documentId);
      } catch (err) {
        console.error("[manual-builder] Import failed:", err);
      }
    },
    [onImportComplete],
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("message", handleMessage);

    // Signal readiness to extension content script
    window.postMessage({ type: "MANUAL_BUILDER_READY" }, "*");

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [enabled, handleMessage]);
}
