import { Canvas, FabricImage, Circle, Textbox, Group } from "fabric";
import { A4_WIDTH, A4_HEIGHT } from "@/types/document";
import type { ManualDocument, PageData } from "@/types/document";
import type { RecordingPayload } from "@/types/recording";
import { saveDocumentWithPages } from "@/lib/storage/document-repository";
import { serializeCanvas, generateThumbnail } from "@/lib/canvas/serialization";

const TITLE_HEIGHT = 36;
const URL_HEIGHT = 30;
const PADDING = 10;

function buildStepTitle(stepNumber: number, pageTitle: string): Textbox {
  return new Textbox(`Step ${stepNumber}: ${pageTitle}`, {
    left: PADDING,
    top: PADDING,
    width: A4_WIDTH - PADDING * 2,
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "sans-serif",
    fill: "#1e293b",
    selectable: true,
  });
}

function buildClickMarker(
  x: number,
  y: number,
  stepNumber: number,
): Group {
  const radius = 14;
  const circle = new Circle({
    radius,
    fill: "#ef4444",
    stroke: "#ffffff",
    strokeWidth: 2,
    originX: "center",
    originY: "center",
  });
  const text = new Textbox(String(stepNumber), {
    fontSize: 14,
    fill: "#ffffff",
    fontWeight: "bold",
    fontFamily: "sans-serif",
    textAlign: "center",
    width: radius * 2,
    originX: "center",
    originY: "center",
  });
  return new Group([circle, text], {
    left: x - radius,
    top: y - radius,
    selectable: true,
  });
}

function buildUrlLabel(url: string): Textbox {
  return new Textbox(url, {
    left: PADDING,
    top: A4_HEIGHT - URL_HEIGHT,
    width: A4_WIDTH - PADDING * 2,
    fontSize: 10,
    fill: "#6b7280",
    fontFamily: "sans-serif",
    selectable: true,
  });
}

export async function importRecording(
  payload: RecordingPayload,
): Promise<{ documentId: string }> {
  const documentId = crypto.randomUUID();
  const pages: PageData[] = [];
  const pageIds: string[] = [];

  // Offscreen canvas pattern (same as pdf-exporter.ts)
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

  const availableHeight = A4_HEIGHT - TITLE_HEIGHT - URL_HEIGHT - PADDING;

  for (const step of payload.steps) {
    const pageId = crypto.randomUUID();
    pageIds.push(pageId);

    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "#ffffff";

    // Step title
    fabricCanvas.add(buildStepTitle(step.stepNumber, step.pageTitle));

    // Load screenshot image
    const img = await FabricImage.fromURL(step.screenshot);
    const imgW = img.width ?? step.viewportWidth;
    const imgH = img.height ?? step.viewportHeight;
    const scale = Math.min(
      A4_WIDTH / imgW,
      availableHeight / imgH,
    );
    const scaledW = imgW * scale;
    const offsetX = (A4_WIDTH - scaledW) / 2;
    const offsetY = TITLE_HEIGHT + PADDING;

    img.set({
      left: offsetX,
      top: offsetY,
      scaleX: scale,
      scaleY: scale,
      selectable: true,
    });
    fabricCanvas.add(img);

    // Click marker
    const markerX = step.clickX * scale + offsetX;
    const markerY = step.clickY * scale + offsetY;
    fabricCanvas.add(buildClickMarker(markerX, markerY, step.stepNumber));

    // URL label
    fabricCanvas.add(buildUrlLabel(step.url));

    fabricCanvas.requestRenderAll();

    const canvasJSON = serializeCanvas(fabricCanvas);
    const thumbnail = generateThumbnail(fabricCanvas);

    pages.push({ id: pageId, documentId, canvasJSON, thumbnail });
  }

  fabricCanvas.dispose();
  document.body.removeChild(offscreenEl);

  const doc: ManualDocument = {
    id: documentId,
    title: payload.title,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    pageIds,
  };

  await saveDocumentWithPages(doc, pages);
  return { documentId };
}
