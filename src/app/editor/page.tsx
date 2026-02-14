"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useDocumentStore } from "@/stores/document-store";
import {
  getDocument,
  getPagesByIds,
  saveDocumentWithPages,
} from "@/lib/storage/document-repository";
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

function useDocumentId(): string | undefined {
  const [id, setId] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Read document ID from URL hash (e.g., /editor#abc123)
    const hash = window.location.hash.slice(1);
    if (hash) {
      setId(hash);
    }
  }, []);

  return id;
}

export default function EditorPage() {
  const documentId = useDocumentId();
  const [ready, setReady] = useState(false);

  const setDocument = useDocumentStore((s) => s.setDocument);
  const setPages = useDocumentStore((s) => s.setPages);
  const setActivePageId = useDocumentStore((s) => s.setActivePageId);
  const reset = useDocumentStore((s) => s.reset);

  useEffect(() => {
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
  }, [documentId]);

  if (!ready) {
    return <EditorLoading />;
  }

  return <EditorShell />;
}
