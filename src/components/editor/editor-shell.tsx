"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { FabricImage } from "fabric";
import { CanvasProvider, useCanvasRef } from "./canvas/canvas-context";
import { CanvasWrapper } from "./canvas/canvas-wrapper";
import { MainToolbar } from "./toolbar/main-toolbar";
import { PagePanel } from "./page-panel/page-panel";
import { PropertyPanel } from "./property-panel/property-panel";
import { ExportDialog } from "./dialogs/export-dialog";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useCanvasStore } from "@/stores/canvas-store";
import { useDocumentStore } from "@/stores/document-store";
import { useHistoryStore } from "@/stores/history-store";
import { serializeCanvas } from "@/lib/canvas/serialization";
import { Input } from "@/components/ui/input";
import { TooltipProvider } from "@/components/ui/tooltip";

function EditorContent() {
  const [exportOpen, setExportOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useCanvasRef();
  const document = useDocumentStore((s) => s.document);
  const updateDocumentTitle = useDocumentStore((s) => s.updateDocumentTitle);
  const activePageId = useDocumentStore((s) => s.activePageId);
  const pushSnapshot = useHistoryStore((s) => s.pushSnapshot);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);

  useKeyboardShortcuts(canvasRef);

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !canvasRef.current) return;

      const reader = new FileReader();
      reader.onload = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const img = await FabricImage.fromURL(reader.result as string);

        // Scale to fit within canvas
        const maxWidth = 400;
        const maxHeight = 400;
        const scaleX = maxWidth / (img.width ?? maxWidth);
        const scaleY = maxHeight / (img.height ?? maxHeight);
        const scale = Math.min(scaleX, scaleY, 1);

        img.set({
          left: 100,
          top: 100,
          scaleX: scale,
          scaleY: scale,
        });

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.requestRenderAll();
        setActiveTool("select");

        pushSnapshot({
          canvasJSON: serializeCanvas(canvas),
          timestamp: Date.now(),
        });
      };
      reader.readAsDataURL(file);

      // Reset input
      e.target.value = "";
    },
    [canvasRef, pushSnapshot, setActiveTool]
  );

  // Handle paste from clipboard (images)
  const handlePaste = useCallback(
    async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items || !canvasRef.current) return;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const blob = item.getAsFile();
          if (!blob) continue;

          const reader = new FileReader();
          reader.onload = async () => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const img = await FabricImage.fromURL(reader.result as string);
            const maxWidth = 400;
            const scaleX = maxWidth / (img.width ?? maxWidth);
            const scale = Math.min(scaleX, 1);

            img.set({ left: 100, top: 100, scaleX: scale, scaleY: scale });
            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.requestRenderAll();

            pushSnapshot({
              canvasJSON: serializeCanvas(canvas),
              timestamp: Date.now(),
            });
          };
          reader.readAsDataURL(blob);
          break;
        }
      }
    },
    [canvasRef, pushSnapshot]
  );

  // Attach paste listener
  useEffect(() => {
    const listener = (e: Event) => handlePaste(e as ClipboardEvent);
    window.addEventListener("paste", listener);
    return () => window.removeEventListener("paste", listener);
  }, [handlePaste]);

  return (
    <div className="h-screen flex flex-col">
      {/* Header with title */}
      <div className="flex items-center gap-3 px-4 py-2 border-b bg-background">
        <Input
          value={document?.title ?? "Untitled Manual"}
          onChange={(e) => updateDocumentTitle(e.target.value)}
          className="h-8 w-64 text-sm font-medium border-none shadow-none focus-visible:ring-1"
        />
        <span className="text-xs text-muted-foreground">
          {activePageId ? "Editing" : "No page selected"}
        </span>
      </div>

      {/* Toolbar */}
      <MainToolbar onExport={() => setExportOpen(true)} onImageUpload={handleImageUpload} />

      {/* Main area: page panel + canvas + property panel */}
      <div className="flex flex-1 overflow-hidden">
        <PagePanel />
        <CanvasWrapper />
        <PropertyPanel />
      </div>

      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Export dialog */}
      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
    </div>
  );
}

export function EditorShell() {
  return (
    <TooltipProvider>
      <CanvasProvider>
        <EditorContent />
      </CanvasProvider>
    </TooltipProvider>
  );
}
