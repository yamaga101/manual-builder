import { Canvas, Line, type FabricObject } from "fabric";
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

const GRID_TAG = "__grid__";

function isGridLine(obj: FabricObject): boolean {
  return (obj as unknown as { _gridTag?: string })._gridTag === GRID_TAG;
}

function tagAsGrid(obj: FabricObject): void {
  (obj as unknown as { _gridTag: string })._gridTag = GRID_TAG;
}

export function drawGrid(canvas: Canvas, gridSize: number) {
  // Remove existing grid lines
  const objects = canvas.getObjects();
  const gridLines = objects.filter(isGridLine);
  gridLines.forEach((line) => canvas.remove(line));

  // Draw grid as non-interactive lines
  for (let x = gridSize; x < A4_WIDTH; x += gridSize) {
    const line = new Line([x, 0, x, A4_HEIGHT], {
      stroke: "#e0e0e0",
      strokeWidth: 0.5,
      selectable: false,
      evented: false,
      excludeFromExport: true,
    });
    tagAsGrid(line);
    canvas.add(line);
    canvas.sendObjectToBack(line);
  }

  for (let y = gridSize; y < A4_HEIGHT; y += gridSize) {
    const line = new Line([0, y, A4_WIDTH, y], {
      stroke: "#e0e0e0",
      strokeWidth: 0.5,
      selectable: false,
      evented: false,
      excludeFromExport: true,
    });
    tagAsGrid(line);
    canvas.add(line);
    canvas.sendObjectToBack(line);
  }

  canvas.requestRenderAll();
}

export function clearGrid(canvas: Canvas) {
  const objects = canvas.getObjects();
  const gridLines = objects.filter(isGridLine);
  gridLines.forEach((line) => canvas.remove(line));
  canvas.requestRenderAll();
}
