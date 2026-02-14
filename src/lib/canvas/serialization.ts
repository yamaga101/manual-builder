import type { Canvas } from "fabric";

export function serializeCanvas(canvas: Canvas): string {
  return JSON.stringify(canvas.toJSON());
}

export function deserializeCanvas(canvas: Canvas, json: string): Promise<void> {
  return new Promise((resolve) => {
    if (!json || json === "{}") {
      canvas.clear();
      canvas.backgroundColor = "#ffffff";
      canvas.requestRenderAll();
      resolve();
      return;
    }

    canvas.loadFromJSON(JSON.parse(json)).then(() => {
      canvas.requestRenderAll();
      resolve();
    });
  });
}

export function generateThumbnail(
  canvas: Canvas,
  maxWidth = 200,
  maxHeight = 283
): string {
  const scale = Math.min(maxWidth / canvas.width!, maxHeight / canvas.height!);
  return canvas.toDataURL({
    format: "png",
    quality: 0.6,
    multiplier: scale,
  });
}
