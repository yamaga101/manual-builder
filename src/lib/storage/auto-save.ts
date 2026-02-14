import type { Canvas } from "fabric";
import { serializeCanvas, generateThumbnail } from "../canvas/serialization";
import { savePage, saveDocument } from "./document-repository";
import { useDocumentStore } from "@/stores/document-store";

const DEBOUNCE_MS = 3000;
let timer: ReturnType<typeof setTimeout> | null = null;

export function triggerAutoSave(canvas: Canvas, pageId: string): void {
  if (timer) clearTimeout(timer);

  timer = setTimeout(async () => {
    const canvasJSON = serializeCanvas(canvas);
    const thumbnail = generateThumbnail(canvas);
    const store = useDocumentStore.getState();

    // Update store
    store.updatePageCanvas(pageId, canvasJSON);
    store.updatePageThumbnail(pageId, thumbnail);

    // Persist to IndexedDB
    const page = store.pages.find((p) => p.id === pageId);
    if (page) {
      await savePage({ ...page, canvasJSON, thumbnail });
    }

    const doc = store.document;
    if (doc) {
      await saveDocument({ ...doc, updatedAt: Date.now() });
    }
  }, DEBOUNCE_MS);
}

export function cancelAutoSave(): void {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}
