import { Canvas } from "fabric";
import { A4_WIDTH, A4_HEIGHT } from "@/types/document";

export interface CanvasSetupOptions {
  containerEl: HTMLDivElement;
  canvasEl: HTMLCanvasElement;
}

export function calculateCanvasDimensions(container: HTMLDivElement) {
  const padding = 40;
  const availableWidth = container.clientWidth - padding * 2;
  const availableHeight = container.clientHeight - padding * 2;

  const scaleX = availableWidth / A4_WIDTH;
  const scaleY = availableHeight / A4_HEIGHT;
  const scale = Math.min(scaleX, scaleY, 1);

  return {
    width: A4_WIDTH,
    height: A4_HEIGHT,
    scale,
    cssWidth: A4_WIDTH * scale,
    cssHeight: A4_HEIGHT * scale,
  };
}

export function createFabricCanvas(
  canvasEl: HTMLCanvasElement,
  _containerEl: HTMLDivElement
): Canvas {
  const canvas = new Canvas(canvasEl, {
    width: A4_WIDTH,
    height: A4_HEIGHT,
    backgroundColor: "#ffffff",
    selection: true,
    preserveObjectStacking: true,
  });

  return canvas;
}

export function drawGrid(canvas: Canvas, gridSize: number) {
  // Remove existing grid lines
  const objects = canvas.getObjects();
  const gridLines = objects.filter(
    (obj) => (obj as Record<string, unknown>).isGrid === true
  );
  gridLines.forEach((line) => canvas.remove(line));

  // We'll use a simpler approach - draw grid via canvas background
  // This avoids polluting the object list
  const gridCanvas = document.createElement("canvas");
  gridCanvas.width = gridSize;
  gridCanvas.height = gridSize;
  const ctx = gridCanvas.getContext("2d");
  if (!ctx) return;

  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(gridSize, 0);
  ctx.lineTo(gridSize, gridSize);
  ctx.moveTo(0, gridSize);
  ctx.lineTo(gridSize, gridSize);
  ctx.stroke();

  const pattern = new (window as unknown as Record<string, unknown>).fabric
    .Pattern({
    source: gridCanvas,
    repeat: "repeat",
  }) as string;

  canvas.set("backgroundColor", pattern);
  canvas.requestRenderAll();
}

export function clearGrid(canvas: Canvas) {
  canvas.set("backgroundColor", "#ffffff");
  canvas.requestRenderAll();
}
