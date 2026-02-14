"use client";

import { Plus, Copy, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDocumentStore } from "@/stores/document-store";
import { useHistoryStore } from "@/stores/history-store";
import { useCanvasRef } from "../canvas/canvas-context";
import {
  serializeCanvas,
  deserializeCanvas,
  generateThumbnail,
} from "@/lib/canvas/serialization";
import { cn } from "@/lib/utils";
import type { PageData } from "@/types/document";

export function PagePanel() {
  const pages = useDocumentStore((s) => s.pages);
  const activePageId = useDocumentStore((s) => s.activePageId);
  const setActivePageId = useDocumentStore((s) => s.setActivePageId);
  const addPage = useDocumentStore((s) => s.addPage);
  const deletePage = useDocumentStore((s) => s.deletePage);
  const duplicatePage = useDocumentStore((s) => s.duplicatePage);
  const updatePageCanvas = useDocumentStore((s) => s.updatePageCanvas);
  const updatePageThumbnail = useDocumentStore((s) => s.updatePageThumbnail);
  const clearHistory = useHistoryStore((s) => s.clear);
  const canvasRef = useCanvasRef();

  const saveCurrentPage = () => {
    const canvas = canvasRef.current;
    if (!canvas || !activePageId) return;

    const json = serializeCanvas(canvas);
    const thumb = generateThumbnail(canvas);
    updatePageCanvas(activePageId, json);
    updatePageThumbnail(activePageId, thumb);
  };

  const switchToPage = async (pageId: string) => {
    if (pageId === activePageId) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Save current page
    saveCurrentPage();

    // Load target page
    const targetPage = pages.find((p) => p.id === pageId);
    if (targetPage) {
      await deserializeCanvas(canvas, targetPage.canvasJSON);
    }

    setActivePageId(pageId);
    clearHistory();
  };

  const handleAddPage = () => {
    saveCurrentPage();
    const newPage: PageData = {
      id: crypto.randomUUID(),
      documentId: pages[0]?.documentId ?? "",
      canvasJSON: "{}",
    };
    addPage(newPage);
    switchToPage(newPage.id);
  };

  const handleDuplicate = (pageId: string) => {
    saveCurrentPage();
    const source = pages.find((p) => p.id === pageId);
    if (!source) return;

    const newPage: PageData = {
      id: crypto.randomUUID(),
      documentId: source.documentId,
      canvasJSON: source.canvasJSON,
      thumbnail: source.thumbnail,
    };
    duplicatePage(pageId, newPage);

    const canvas = canvasRef.current;
    if (canvas) {
      deserializeCanvas(canvas, newPage.canvasJSON);
    }
    clearHistory();
  };

  const handleDelete = (pageId: string) => {
    if (pages.length <= 1) return;
    deletePage(pageId);

    if (pageId === activePageId) {
      const remaining = pages.filter((p) => p.id !== pageId);
      if (remaining.length > 0) {
        switchToPage(remaining[0].id);
      }
    }
  };

  return (
    <div className="w-48 border-r bg-background flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-sm font-medium">Pages</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleAddPage}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add page</TooltipContent>
        </Tooltip>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {pages.map((page, index) => (
            <div
              key={page.id}
              className={cn(
                "group relative rounded-md border cursor-pointer transition-colors",
                page.id === activePageId
                  ? "border-primary ring-1 ring-primary"
                  : "border-border hover:border-muted-foreground"
              )}
              onClick={() => switchToPage(page.id)}
            >
              {/* Thumbnail */}
              <div className="aspect-[795/1123] bg-white rounded-t-md overflow-hidden">
                {page.thumbnail ? (
                  <img
                    src={page.thumbnail}
                    alt={`Page ${index + 1}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                    Empty
                  </div>
                )}
              </div>

              {/* Page number + actions */}
              <div className="flex items-center justify-between px-2 py-1">
                <div className="flex items-center gap-1">
                  <GripVertical className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs">{index + 1}</span>
                </div>

                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicate(page.id);
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  {pages.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(page.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
