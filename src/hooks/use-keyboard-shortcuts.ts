"use client";

import { useEffect } from "react";
import { useCanvasStore } from "@/stores/canvas-store";
import { useHistoryStore } from "@/stores/history-store";
import { copySelected, pasteFromClipboard, deleteSelected } from "@/lib/canvas/clipboard";
import { deserializeCanvas } from "@/lib/canvas/serialization";
import type { Canvas } from "fabric";
import type { MutableRefObject } from "react";

export function useKeyboardShortcuts(
  canvasRef: MutableRefObject<Canvas | null>
) {
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);
  const undo = useHistoryStore((s) => s.undo);
  const redo = useHistoryStore((s) => s.redo);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Skip when typing in input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      // Also skip when Fabric.js text editing is active
      const activeObj = canvas.getActiveObject();
      if (activeObj && "isEditing" in activeObj && activeObj.isEditing) return;

      const ctrl = e.ctrlKey || e.metaKey;

      // Tool shortcuts
      if (!ctrl && !e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case "v":
            setActiveTool("select");
            e.preventDefault();
            return;
          case "t":
            setActiveTool("text");
            e.preventDefault();
            return;
          case "r":
            setActiveTool("rectangle");
            e.preventDefault();
            return;
          case "e":
            setActiveTool("ellipse");
            e.preventDefault();
            return;
          case "a":
            setActiveTool("arrow");
            e.preventDefault();
            return;
          case "h":
            setActiveTool("highlight");
            e.preventDefault();
            return;
          case "f":
            setActiveTool("freehand");
            e.preventDefault();
            return;
          case "c":
            if (!ctrl) {
              setActiveTool("callout");
              e.preventDefault();
            }
            return;
        }
      }

      // Delete / Backspace
      if (e.key === "Delete" || e.key === "Backspace") {
        deleteSelected(canvas);
        e.preventDefault();
        return;
      }

      // Ctrl+Z -> undo
      if (ctrl && e.key === "z" && !e.shiftKey) {
        const snapshot = undo();
        if (snapshot) {
          deserializeCanvas(canvas, snapshot.canvasJSON);
        }
        e.preventDefault();
        return;
      }

      // Ctrl+Shift+Z -> redo
      if (ctrl && e.key === "z" && e.shiftKey) {
        const snapshot = redo();
        if (snapshot) {
          deserializeCanvas(canvas, snapshot.canvasJSON);
        }
        e.preventDefault();
        return;
      }

      // Ctrl+C -> copy
      if (ctrl && e.key === "c") {
        copySelected(canvas);
        e.preventDefault();
        return;
      }

      // Ctrl+V -> paste
      if (ctrl && e.key === "v") {
        pasteFromClipboard(canvas);
        e.preventDefault();
        return;
      }

      // Ctrl+X -> cut
      if (ctrl && e.key === "x") {
        copySelected(canvas).then(() => {
          deleteSelected(canvas);
        });
        e.preventDefault();
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [canvasRef, setActiveTool, undo, redo]);
}
