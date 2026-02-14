// Canvas dimensions: A4 at 96 DPI
export const A4_WIDTH = 795;
export const A4_HEIGHT = 1123;

export type ToolType =
  | "select"
  | "text"
  | "rectangle"
  | "ellipse"
  | "arrow"
  | "callout"
  | "highlight"
  | "freehand"
  | "image"
  | "flowchart-rect"
  | "flowchart-diamond"
  | "flowchart-oval"
  | "connector";

export interface ManualDocument {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  pageIds: string[];
}

export interface PageData {
  id: string;
  documentId: string;
  canvasJSON: string; // Fabric.js serialized JSON
  thumbnail?: string; // Base64 data URL
}

export interface ExportOptions {
  format: "pdf" | "png";
  quality: "standard" | "high";
  includePageNumbers: boolean;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface HistorySnapshot {
  canvasJSON: string;
  timestamp: number;
}
