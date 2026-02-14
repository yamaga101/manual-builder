"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  Canvas,
  Textbox,
  Rect,
  Ellipse,
  Line,
  Circle,
  Group,
  Polygon,
  FabricObject,
  PencilBrush,
} from "fabric";
import { useCanvasRef } from "./canvas-context";
import { useCanvasStore } from "@/stores/canvas-store";
import { useHistoryStore } from "@/stores/history-store";
import { useDocumentStore } from "@/stores/document-store";
import { serializeCanvas } from "@/lib/canvas/serialization";
import { triggerAutoSave } from "@/lib/storage/auto-save";
import { A4_WIDTH, A4_HEIGHT } from "@/types/document";

// Counter for callout badges
let calloutCounter = 1;

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

    // Save snapshot after freehand path is created
    canvas.on("path:created", () => {
      saveSnapshot();
    });

    return () => {
      canvas.dispose();
      canvasRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle freehand drawing mode
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (activeTool === "freehand") {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new PencilBrush(canvas);
      canvas.freeDrawingBrush.color = "#ff0000";
      canvas.freeDrawingBrush.width = 2;
    } else {
      canvas.isDrawingMode = false;
    }
  }, [activeTool, canvasRef]);

  // Handle tool-based mouse interactions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (opt: { e: MouseEvent }) => {
      if (activeTool === "select" || activeTool === "freehand") return;

      const pointer = canvas.getScenePoint(opt.e);
      isDrawing.current = true;
      drawStart.current = { x: pointer.x, y: pointer.y };

      // Text tool
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

      // Callout tool (numbered circle badge)
      if (activeTool === "callout") {
        const radius = 14;
        const circle = new Circle({
          radius,
          fill: "#ef4444",
          originX: "center",
          originY: "center",
        });
        const text = new Textbox(String(calloutCounter++), {
          fontSize: 14,
          fill: "#ffffff",
          fontWeight: "bold",
          fontFamily: "sans-serif",
          textAlign: "center",
          width: radius * 2,
          originX: "center",
          originY: "center",
        });
        const group = new Group([circle, text], {
          left: pointer.x - radius,
          top: pointer.y - radius,
        });
        canvas.add(group);
        canvas.setActiveObject(group);
        setActiveTool("select");
        isDrawing.current = false;
        saveSnapshot();
        return;
      }

      // Flowchart rectangle (process box)
      if (activeTool === "flowchart-rect") {
        const rect = new Rect({
          width: 160,
          height: 60,
          fill: "#e0f2fe",
          stroke: "#0284c7",
          strokeWidth: 2,
          rx: 8,
          ry: 8,
          originX: "center",
          originY: "center",
        });
        const text = new Textbox("Process", {
          fontSize: 14,
          fill: "#0c4a6e",
          fontFamily: "sans-serif",
          textAlign: "center",
          width: 140,
          originX: "center",
          originY: "center",
        });
        const group = new Group([rect, text], {
          left: pointer.x - 80,
          top: pointer.y - 30,
        });
        canvas.add(group);
        canvas.setActiveObject(group);
        setActiveTool("select");
        isDrawing.current = false;
        saveSnapshot();
        return;
      }

      // Flowchart diamond (decision)
      if (activeTool === "flowchart-diamond") {
        const size = 80;
        const diamond = new Polygon(
          [
            { x: size, y: 0 },
            { x: size * 2, y: size },
            { x: size, y: size * 2 },
            { x: 0, y: size },
          ],
          {
            fill: "#fef3c7",
            stroke: "#d97706",
            strokeWidth: 2,
            originX: "center",
            originY: "center",
          }
        );
        const text = new Textbox("Decision?", {
          fontSize: 13,
          fill: "#92400e",
          fontFamily: "sans-serif",
          textAlign: "center",
          width: 100,
          originX: "center",
          originY: "center",
        });
        const group = new Group([diamond, text], {
          left: pointer.x - size,
          top: pointer.y - size,
        });
        canvas.add(group);
        canvas.setActiveObject(group);
        setActiveTool("select");
        isDrawing.current = false;
        saveSnapshot();
        return;
      }

      // Flowchart oval (start/end)
      if (activeTool === "flowchart-oval") {
        const ellipse = new Ellipse({
          rx: 60,
          ry: 25,
          fill: "#dcfce7",
          stroke: "#16a34a",
          strokeWidth: 2,
          originX: "center",
          originY: "center",
        });
        const text = new Textbox("Start", {
          fontSize: 14,
          fill: "#166534",
          fontFamily: "sans-serif",
          textAlign: "center",
          width: 100,
          originX: "center",
          originY: "center",
        });
        const group = new Group([ellipse, text], {
          left: pointer.x - 60,
          top: pointer.y - 25,
        });
        canvas.add(group);
        canvas.setActiveObject(group);
        setActiveTool("select");
        isDrawing.current = false;
        saveSnapshot();
        return;
      }

      // Rectangle / Highlight
      if (activeTool === "rectangle" || activeTool === "highlight") {
        const rect = new Rect({
          left: pointer.x,
          top: pointer.y,
          width: 1,
          height: 1,
          fill:
            activeTool === "highlight"
              ? "rgba(255,255,0,0.3)"
              : "transparent",
          stroke: activeTool === "highlight" ? "transparent" : "#000000",
          strokeWidth: activeTool === "highlight" ? 0 : 2,
          selectable: false,
        });
        canvas.add(rect);
        tempObject.current = rect;
      }

      // Ellipse
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

      // Arrow
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

      // Connector (same as arrow for MVP)
      if (activeTool === "connector") {
        const line = new Line(
          [pointer.x, pointer.y, pointer.x, pointer.y],
          {
            stroke: "#6b7280",
            strokeWidth: 1.5,
            strokeDashArray: [5, 3],
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

      if (activeTool === "rectangle" || activeTool === "highlight") {
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

      if (activeTool === "arrow" || activeTool === "connector") {
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

    canvas.on(
      "mouse:down",
      handleMouseDown as unknown as (...args: unknown[]) => void
    );
    canvas.on(
      "mouse:move",
      handleMouseMove as unknown as (...args: unknown[]) => void
    );
    canvas.on(
      "mouse:up",
      handleMouseUp as unknown as (...args: unknown[]) => void
    );

    // Cursor based on tool
    if (activeTool === "select" || activeTool === "freehand") {
      canvas.defaultCursor = activeTool === "freehand" ? "crosshair" : "default";
      if (activeTool === "select") {
        canvas.selection = true;
      }
    } else {
      canvas.defaultCursor = "crosshair";
      canvas.selection = false;
    }

    return () => {
      canvas.off(
        "mouse:down",
        handleMouseDown as unknown as (...args: unknown[]) => void
      );
      canvas.off(
        "mouse:move",
        handleMouseMove as unknown as (...args: unknown[]) => void
      );
      canvas.off(
        "mouse:up",
        handleMouseUp as unknown as (...args: unknown[]) => void
      );
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
