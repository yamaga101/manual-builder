"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useCallback } from "react";
import { useDocumentStore } from "@/stores/document-store";
import {
  getDocument,
  getPagesByIds,
  saveDocumentWithPages,
} from "@/lib/storage/document-repository";
import { useExtensionListener } from "@/hooks/use-extension-listener";
import type { ManualDocument, PageData } from "@/types/document";

// Dynamic import with SSR disabled - Fabric.js requires DOM
const EditorShell = dynamic(
  () =>
    import("@/components/editor/editor-shell").then((mod) => mod.EditorShell),
  { ssr: false, loading: () => <EditorLoading /> }
);

function EditorLoading() {
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-muted-foreground">Loading editor...</div>
    </div>
  );
}

function ImportWaiting() {
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <div className="animate-pulse text-primary text-lg font-medium">
        録画データを待機中...
      </div>
      <p className="text-muted-foreground text-sm">
        Chrome拡張から送信してください
      </p>
    </div>
  );
}

function useHashValue(): string {
  const [hash, setHash] = useState("");

  useEffect(() => {
    setHash(window.location.hash.slice(1));
  }, []);

  return hash;
}

export default function EditorPage() {
  const hash = useHashValue();
  const isImportMode = hash === "import";
  const documentId = isImportMode ? undefined : hash || undefined;

  const [ready, setReady] = useState(false);

  const setDocument = useDocumentStore((s) => s.setDocument);
  const setPages = useDocumentStore((s) => s.setPages);
  const setActivePageId = useDocumentStore((s) => s.setActivePageId);
  const reset = useDocumentStore((s) => s.reset);

  // Handle import completion from extension
  const handleImportComplete = useCallback(
    async (newDocId: string) => {
      const doc = await getDocument(newDocId);
      if (!doc) return;
      const pages = await getPagesByIds(doc.pageIds);
      reset();
      setDocument(doc);
      setPages(pages);
      setActivePageId(pages[0]?.id ?? null);
      window.location.hash = newDocId;
      setReady(true);
    },
    [reset, setDocument, setPages, setActivePageId],
  );

  useExtensionListener(isImportMode && !ready, handleImportComplete);

  useEffect(() => {
    if (isImportMode) return; // Wait for extension data

    async function load() {
      reset();

      if (documentId) {
        // Load existing document
        const doc = await getDocument(documentId);
        if (doc) {
          const pages = await getPagesByIds(doc.pageIds);
          setDocument(doc);
          setPages(pages);
          setActivePageId(pages[0]?.id ?? null);
          setReady(true);
          return;
        }
      }

      // Create new document
      const newDocId = documentId ?? crypto.randomUUID();
      const firstPageId = crypto.randomUUID();

      const newDoc: ManualDocument = {
        id: newDocId,
        title: "Untitled Manual",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        pageIds: [firstPageId],
      };

      const firstPage: PageData = {
        id: firstPageId,
        documentId: newDocId,
        canvasJSON: "{}",
      };

      await saveDocumentWithPages(newDoc, [firstPage]);

      setDocument(newDoc);
      setPages([firstPage]);
      setActivePageId(firstPageId);

      // Update URL hash with new document ID
      window.location.hash = newDocId;
      setReady(true);
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, isImportMode]);

  if (isImportMode && !ready) {
    return <ImportWaiting />;
  }

  if (!ready) {
    return <EditorLoading />;
  }

  return <EditorShell />;
}
