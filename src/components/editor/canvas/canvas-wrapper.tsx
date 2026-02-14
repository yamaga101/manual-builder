"use client";

import { useEffect, useRef, useCallback } from "react";
import { Canvas, Textbox, Rect, Ellipse, Line, FabricObject } from "fabric";
import { useCanvasRef } from "./canvas-context";
import { useCanvasStore } from "@/stores/canvas-store";
import { useHistoryStore } from "@/stores/history-store";
import { useDocumentStore } from "@/stores/document-store";
import { serializeCanvas } from "@/lib/canvas/serialization";
import { triggerAutoSave } from "@/lib/storage/auto-save";
import { A4_WIDTH, A4_HEIGHT } from "@/types/document";
import type { ToolType } from "@/types/document";

export function CanvasWrapper() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useCanvasRef();
  const isDrawing = useRef(false);
  const drawStart = useRef({ x: 0, y: 0 });
  const tempObject = useRef<FabricObject | null>(null);

  const activeTool = useCanvasStore((s) => s.activeTool);
  const zoom = useCanvasStore((s) => s.zoom);
  const setSelection = useCanvasStore((s) => s.setSelection);
  const clearSelection = useCanvasStore((s) => s.clearSelection);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);
  const pushSnapshot = useHistoryStore((s) => s.pushSnapshot);
  const activePageId = useDocumentStore((s) => s.activePageId);

  const saveSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    pushSnapshot({
      canvasJSON: serializeCanvas(canvas),
      timestamp: Date.now(),
    });
    if (activePageId) {
      triggerAutoSave(canvas, activePageId);
    }
  }, [canvasRef, pushSnapshot, activePageId]);

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasElRef.current || canvasRef.current) return;

    const canvas = new Canvas(canvasElRef.current, {
      width: A4_WIDTH,
      height: A4_HEIGHT,
      backgroundColor: "#ffffff",
      selection: true,
      preserveObjectStacking: true,
    });

    canvasRef.current = canvas;

    // Selection events
    canvas.on("selection:created", (e) => {
      const selected = e.selected ?? [];
      setSelection(
        selected.length,
        selected.length === 1 ? selected[0].type ?? null : "mixed"
      );
    });

    canvas.on("selection:updated", (e) => {
      const selected = e.selected ?? [];
      setSelection(
        selected.length,
        selected.length === 1 ? selected[0].type ?? null : "mixed"
      );
    });

    canvas.on("selection:cleared", () => {
      clearSelection();
    });

    // Object modification events -> save snapshot
    canvas.on("object:modified", () => {
      saveSnapshot();
    });

    return () => {
      canvas.dispose();
      canvasRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle zoom changes
  useEffect(() => {
    const container = containerRef.current;
    const canvasEl = canvasElRef.current;
    if (!container || !canvasEl) return;

    const wrapper = canvasEl.parentElement?.parentElement as HTMLElement;
    if (wrapper) {
      wrapper.style.transform = `scale(${zoom})`;
      wrapper.style.transformOrigin = "center top";
    }
  }, [zoom]);

  // Handle tool-based mouse interactions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (opt: { e: MouseEvent }) => {
      if (activeTool === "select") return;

      const pointer = canvas.getScenePoint(opt.e);
      isDrawing.current = true;
      drawStart.current = { x: pointer.x, y: pointer.y };

      if (activeTool === "text") {
        const textbox = new Textbox("テキストを入力", {
          left: pointer.x,
          top: pointer.y,
          width: 200,
          fontSize: 16,
          fontFamily: "sans-serif",
          fill: "#000000",
        });
        canvas.add(textbox);
        canvas.setActiveObject(textbox);
        textbox.enterEditing();
        setActiveTool("select");
        isDrawing.current = false;
        saveSnapshot();
        return;
      }

      if (activeTool === "rectangle" || activeTool === "highlight") {
        const rect = new Rect({
          left: pointer.x,
          top: pointer.y,
          width: 1,
          height: 1,
          fill: activeTool === "highlight" ? "rgba(255,255,0,0.3)" : "transparent",
          stroke: activeTool === "highlight" ? "transparent" : "#000000",
          strokeWidth: activeTool === "highlight" ? 0 : 2,
          selectable: false,
        });
        canvas.add(rect);
        tempObject.current = rect;
      }

      if (activeTool === "ellipse") {
        const ellipse = new Ellipse({
          left: pointer.x,
          top: pointer.y,
          rx: 1,
          ry: 1,
          fill: "transparent",
          stroke: "#000000",
          strokeWidth: 2,
          selectable: false,
        });
        canvas.add(ellipse);
        tempObject.current = ellipse;
      }

      if (activeTool === "arrow") {
        const line = new Line(
          [pointer.x, pointer.y, pointer.x, pointer.y],
          {
            stroke: "#000000",
            strokeWidth: 2,
            selectable: false,
          }
        );
        canvas.add(line);
        tempObject.current = line;
      }
    };

    const handleMouseMove = (opt: { e: MouseEvent }) => {
      if (!isDrawing.current || !tempObject.current) return;

      const pointer = canvas.getScenePoint(opt.e);
      const startX = drawStart.current.x;
      const startY = drawStart.current.y;

      if (
        activeTool === "rectangle" ||
        activeTool === "highlight"
      ) {
        const rect = tempObject.current as InstanceType<typeof Rect>;
        const width = Math.abs(pointer.x - startX);
        const height = Math.abs(pointer.y - startY);
        rect.set({
          left: Math.min(startX, pointer.x),
          top: Math.min(startY, pointer.y),
          width,
          height,
        });
      }

      if (activeTool === "ellipse") {
        const ellipse = tempObject.current as InstanceType<typeof Ellipse>;
        const rx = Math.abs(pointer.x - startX) / 2;
        const ry = Math.abs(pointer.y - startY) / 2;
        ellipse.set({
          left: Math.min(startX, pointer.x),
          top: Math.min(startY, pointer.y),
          rx,
          ry,
        });
      }

      if (activeTool === "arrow") {
        const line = tempObject.current as InstanceType<typeof Line>;
        line.set({ x2: pointer.x, y2: pointer.y });
      }

      canvas.requestRenderAll();
    };

    const handleMouseUp = () => {
      if (!isDrawing.current) return;
      isDrawing.current = false;

      if (tempObject.current) {
        tempObject.current.set({ selectable: true });
        canvas.setActiveObject(tempObject.current);
        tempObject.current = null;
        saveSnapshot();
      }

      if (activeTool !== "highlight") {
        setActiveTool("select");
      }
    };

    canvas.on("mouse:down", handleMouseDown as unknown as (...args: unknown[]) => void);
    canvas.on("mouse:move", handleMouseMove as unknown as (...args: unknown[]) => void);
    canvas.on("mouse:up", handleMouseUp as unknown as (...args: unknown[]) => void);

    // Cursor based on tool
    if (activeTool === "select") {
      canvas.defaultCursor = "default";
      canvas.selection = true;
    } else {
      canvas.defaultCursor = "crosshair";
      canvas.selection = false;
    }

    return () => {
      canvas.off("mouse:down", handleMouseDown as unknown as (...args: unknown[]) => void);
      canvas.off("mouse:move", handleMouseMove as unknown as (...args: unknown[]) => void);
      canvas.off("mouse:up", handleMouseUp as unknown as (...args: unknown[]) => void);
    };
  }, [activeTool, canvasRef, saveSnapshot, setActiveTool]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto bg-muted/30 flex items-start justify-center p-8"
    >
      <div
        className="shadow-lg"
        style={{
          width: A4_WIDTH,
          height: A4_HEIGHT,
          transform: `scale(${zoom})`,
          transformOrigin: "center top",
        }}
      >
        <canvas ref={canvasElRef} />
      </div>
    </div>
  );
}
