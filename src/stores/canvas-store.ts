import { create } from "zustand";
import type { ToolType } from "@/types/document";

interface CanvasState {
  activeTool: ToolType;
  zoom: number;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;

  // Selection state (synced from Fabric.js events)
  selectedObjectCount: number;
  selectedObjectType: string | null;

  // Actions
  setActiveTool: (tool: ToolType) => void;
  setZoom: (zoom: number) => void;
  setShowGrid: (show: boolean) => void;
  setSnapToGrid: (snap: boolean) => void;
  setGridSize: (size: number) => void;
  setSelection: (count: number, type: string | null) => void;
  clearSelection: () => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  activeTool: "select",
  zoom: 1,
  showGrid: false,
  snapToGrid: false,
  gridSize: 20,
  selectedObjectCount: 0,
  selectedObjectType: null,

  setActiveTool: (tool) => set({ activeTool: tool }),
  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(3, zoom)) }),
  setShowGrid: (show) => set({ showGrid: show }),
  setSnapToGrid: (snap) => set({ snapToGrid: snap }),
  setGridSize: (size) => set({ gridSize: size }),
  setSelection: (count, type) =>
    set({ selectedObjectCount: count, selectedObjectType: type }),
  clearSelection: () =>
    set({ selectedObjectCount: 0, selectedObjectType: null }),
}));
