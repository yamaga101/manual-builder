"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useDocumentStore } from "@/stores/document-store";
import { exportToPDF, exportPageToPNG } from "@/lib/export/pdf-exporter";
import type { ExportOptions } from "@/types/document";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const pages = useDocumentStore((s) => s.pages);
  const document = useDocumentStore((s) => s.document);
  const activePageId = useDocumentStore((s) => s.activePageId);
  const [exporting, setExporting] = useState(false);
  const [format, setFormat] = useState<"pdf" | "png">("pdf");
  const [quality, setQuality] = useState<"standard" | "high">("standard");
  const [includePageNumbers, setIncludePageNumbers] = useState(true);

  const handleExport = async () => {
    setExporting(true);
    try {
      const filename = document?.title ?? "manual";

      if (format === "pdf") {
        const options: ExportOptions = {
          format: "pdf",
          quality,
          includePageNumbers,
          margins: { top: 10, right: 10, bottom: 10, left: 10 },
        };
        const blob = await exportToPDF(pages, options);
        downloadBlob(blob, `${filename}.pdf`);
      } else {
        const activePage = pages.find((p) => p.id === activePageId);
        if (activePage) {
          const blob = await exportPageToPNG(
            activePage,
            quality === "high" ? 3 : 2
          );
          downloadBlob(blob, `${filename}-page.png`);
        }
      }

      onOpenChange(false);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Format */}
          <div className="space-y-1.5">
            <Label className="text-sm">Format</Label>
            <div className="flex gap-2">
              <Button
                variant={format === "pdf" ? "default" : "outline"}
                size="sm"
                onClick={() => setFormat("pdf")}
              >
                PDF (All pages)
              </Button>
              <Button
                variant={format === "png" ? "default" : "outline"}
                size="sm"
                onClick={() => setFormat("png")}
              >
                PNG (Current page)
              </Button>
            </div>
          </div>

          {/* Quality */}
          <div className="space-y-1.5">
            <Label className="text-sm">Quality</Label>
            <div className="flex gap-2">
              <Button
                variant={quality === "standard" ? "default" : "outline"}
                size="sm"
                onClick={() => setQuality("standard")}
              >
                Standard
              </Button>
              <Button
                variant={quality === "high" ? "default" : "outline"}
                size="sm"
                onClick={() => setQuality("high")}
              >
                High
              </Button>
            </div>
          </div>

          {/* Page numbers (PDF only) */}
          {format === "pdf" && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pageNumbers"
                checked={includePageNumbers}
                onChange={(e) => setIncludePageNumbers(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="pageNumbers" className="text-sm">
                Include page numbers
              </Label>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {format === "pdf"
              ? `${pages.length} page(s) will be exported as A4 PDF`
              : "Current page will be exported as PNG image"}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? "Exporting..." : "Export"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = window.document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
