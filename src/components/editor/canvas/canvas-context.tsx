"use client";

import { createContext, useContext, useRef, type MutableRefObject } from "react";
import type { Canvas } from "fabric";

interface CanvasContextValue {
  canvasRef: MutableRefObject<Canvas | null>;
}

const CanvasContext = createContext<CanvasContextValue | null>(null);

export function CanvasProvider({ children }: { children: React.ReactNode }) {
  const canvasRef = useRef<Canvas | null>(null);

  return (
    <CanvasContext.Provider value={{ canvasRef }}>
      {children}
    </CanvasContext.Provider>
  );
}

export function useCanvasRef(): MutableRefObject<Canvas | null> {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error("useCanvasRef must be used within CanvasProvider");
  }
  return context.canvasRef;
}
