import { jsPDF } from "jspdf";
import { Canvas } from "fabric";
import { deserializeCanvas } from "../canvas/serialization";
import { A4_WIDTH, A4_HEIGHT } from "@/types/document";
import type { ExportOptions, PageData } from "@/types/document";
import { PDF_PAGE_WIDTH, PDF_PAGE_HEIGHT } from "./constants";

export async function exportToPDF(
  pages: PageData[],
  options: ExportOptions
): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const multiplier = options.quality === "high" ? 2 : 1;

  // Create offscreen canvas for rendering
  const offscreenEl = document.createElement("canvas");
  offscreenEl.width = A4_WIDTH;
  offscreenEl.height = A4_HEIGHT;
  offscreenEl.style.display = "none";
  document.body.appendChild(offscreenEl);

  const fabricCanvas = new Canvas(offscreenEl, {
    width: A4_WIDTH,
    height: A4_HEIGHT,
    backgroundColor: "#ffffff",
  });

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) {
      pdf.addPage();
    }

    const page = pages[i];
    await deserializeCanvas(fabricCanvas, page.canvasJSON);

    const dataUrl = fabricCanvas.toDataURL({
      format: "png",
      multiplier,
    });

    const { top, right, bottom, left } = options.margins;
    const imgWidth = PDF_PAGE_WIDTH - left - right;
    const imgHeight = PDF_PAGE_HEIGHT - top - bottom;

    pdf.addImage(dataUrl, "PNG", left, top, imgWidth, imgHeight);

    if (options.includePageNumbers) {
      pdf.setFontSize(10);
      pdf.setTextColor(128, 128, 128);
      pdf.text(
        `${i + 1} / ${pages.length}`,
        PDF_PAGE_WIDTH / 2,
        PDF_PAGE_HEIGHT - 5,
        { align: "center" }
      );
    }
  }

  // Cleanup
  fabricCanvas.dispose();
  document.body.removeChild(offscreenEl);

  return pdf.output("blob");
}

export async function exportPageToPNG(
  page: PageData,
  multiplier = 2
): Promise<Blob> {
  const offscreenEl = document.createElement("canvas");
  offscreenEl.width = A4_WIDTH;
  offscreenEl.height = A4_HEIGHT;
  offscreenEl.style.display = "none";
  document.body.appendChild(offscreenEl);

  const fabricCanvas = new Canvas(offscreenEl, {
    width: A4_WIDTH,
    height: A4_HEIGHT,
    backgroundColor: "#ffffff",
  });

  await deserializeCanvas(fabricCanvas, page.canvasJSON);

  const dataUrl = fabricCanvas.toDataURL({
    format: "png",
    multiplier,
  });

  fabricCanvas.dispose();
  document.body.removeChild(offscreenEl);

  // Convert data URL to blob
  const response = await fetch(dataUrl);
  return response.blob();
}
