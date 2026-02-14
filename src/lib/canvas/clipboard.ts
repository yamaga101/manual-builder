import type { Canvas, FabricObject } from "fabric";

let clipboardData: FabricObject[] = [];

export async function copySelected(canvas: Canvas): Promise<void> {
  const activeObject = canvas.getActiveObject();
  if (!activeObject) return;

  const cloned = await activeObject.clone();
  clipboardData = [cloned];
}

export async function pasteFromClipboard(canvas: Canvas): Promise<void> {
  if (clipboardData.length === 0) return;

  for (const obj of clipboardData) {
    const cloned = await obj.clone();
    cloned.set({
      left: (cloned.left ?? 0) + 20,
      top: (cloned.top ?? 0) + 20,
    });
    canvas.add(cloned);
    canvas.setActiveObject(cloned);
  }

  canvas.requestRenderAll();
}

export function deleteSelected(canvas: Canvas): void {
  const activeObjects = canvas.getActiveObjects();
  if (activeObjects.length === 0) return;

  activeObjects.forEach((obj) => canvas.remove(obj));
  canvas.discardActiveObject();
  canvas.requestRenderAll();
}
