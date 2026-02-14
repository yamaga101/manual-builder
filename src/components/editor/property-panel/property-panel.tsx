"use client";

import { useEffect, useState, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { useCanvasRef } from "../canvas/canvas-context";
import { useCanvasStore } from "@/stores/canvas-store";
import type { FabricObject, Textbox } from "fabric";

interface ObjectProps {
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  // Text-specific
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: string;
}

const DEFAULT_PROPS: ObjectProps = {
  fill: "#000000",
  stroke: "#000000",
  strokeWidth: 1,
  opacity: 1,
};

export function PropertyPanel() {
  const canvasRef = useCanvasRef();
  const selectedCount = useCanvasStore((s) => s.selectedObjectCount);
  const selectedType = useCanvasStore((s) => s.selectedObjectType);
  const [props, setProps] = useState<ObjectProps>(DEFAULT_PROPS);

  const syncFromCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const active = canvas.getActiveObject();
    if (!active) {
      setProps(DEFAULT_PROPS);
      return;
    }

    const newProps: ObjectProps = {
      fill: (active.fill as string) ?? "#000000",
      stroke: (active.stroke as string) ?? "#000000",
      strokeWidth: active.strokeWidth ?? 1,
      opacity: active.opacity ?? 1,
    };

    if (active.type === "textbox" || active.type === "text") {
      const textObj = active as unknown as Textbox;
      newProps.fontSize = textObj.fontSize ?? 16;
      newProps.fontFamily = textObj.fontFamily ?? "sans-serif";
      newProps.fontWeight = (textObj.fontWeight as string) ?? "normal";
      newProps.textAlign = textObj.textAlign ?? "left";
    }

    setProps(newProps);
  }, [canvasRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handler = () => syncFromCanvas();
    canvas.on("selection:created", handler);
    canvas.on("selection:updated", handler);
    canvas.on("selection:cleared", handler);
    canvas.on("object:modified", handler);

    return () => {
      canvas.off("selection:created", handler);
      canvas.off("selection:updated", handler);
      canvas.off("selection:cleared", handler);
      canvas.off("object:modified", handler);
    };
  }, [canvasRef, syncFromCanvas]);

  const updateProperty = (key: string, value: unknown) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const active = canvas.getActiveObject();
    if (!active) return;

    active.set(key as keyof FabricObject, value);
    canvas.requestRenderAll();
    syncFromCanvas();
  };

  if (selectedCount === 0) {
    return (
      <div className="w-56 border-l bg-background p-4">
        <p className="text-sm text-muted-foreground">
          Select an object to edit its properties
        </p>
      </div>
    );
  }

  const isText = selectedType === "textbox" || selectedType === "text";

  return (
    <div className="w-56 border-l bg-background p-4 space-y-4 overflow-y-auto">
      <h3 className="text-sm font-medium">Properties</h3>

      {/* Fill */}
      <div className="space-y-1.5">
        <Label className="text-xs">Fill</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={props.fill || "#000000"}
            onChange={(e) => updateProperty("fill", e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border"
          />
          <Input
            value={props.fill || ""}
            onChange={(e) => updateProperty("fill", e.target.value)}
            className="h-8 text-xs"
          />
        </div>
      </div>

      {/* Stroke */}
      <div className="space-y-1.5">
        <Label className="text-xs">Stroke</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={props.stroke || "#000000"}
            onChange={(e) => updateProperty("stroke", e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border"
          />
          <Input
            value={props.stroke || ""}
            onChange={(e) => updateProperty("stroke", e.target.value)}
            className="h-8 text-xs"
          />
        </div>
      </div>

      {/* Stroke Width */}
      <div className="space-y-1.5">
        <Label className="text-xs">Stroke Width: {props.strokeWidth}px</Label>
        <Slider
          value={[props.strokeWidth]}
          min={0}
          max={20}
          step={1}
          onValueChange={([v]) => updateProperty("strokeWidth", v)}
        />
      </div>

      {/* Opacity */}
      <div className="space-y-1.5">
        <Label className="text-xs">
          Opacity: {Math.round(props.opacity * 100)}%
        </Label>
        <Slider
          value={[props.opacity]}
          min={0}
          max={1}
          step={0.05}
          onValueChange={([v]) => updateProperty("opacity", v)}
        />
      </div>

      {isText && (
        <>
          <Separator />
          <h3 className="text-sm font-medium">Text</h3>

          {/* Font Size */}
          <div className="space-y-1.5">
            <Label className="text-xs">Font Size</Label>
            <Input
              type="number"
              value={props.fontSize ?? 16}
              min={8}
              max={200}
              onChange={(e) =>
                updateProperty("fontSize", parseInt(e.target.value, 10))
              }
              className="h-8 text-xs"
            />
          </div>

          {/* Font Family */}
          <div className="space-y-1.5">
            <Label className="text-xs">Font Family</Label>
            <select
              value={props.fontFamily ?? "sans-serif"}
              onChange={(e) => updateProperty("fontFamily", e.target.value)}
              className="w-full h-8 text-xs rounded-md border bg-background px-2"
            >
              <option value="sans-serif">Sans Serif</option>
              <option value="serif">Serif</option>
              <option value="monospace">Monospace</option>
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
            </select>
          </div>

          {/* Font Weight */}
          <div className="space-y-1.5">
            <Label className="text-xs">Font Weight</Label>
            <select
              value={props.fontWeight ?? "normal"}
              onChange={(e) => updateProperty("fontWeight", e.target.value)}
              className="w-full h-8 text-xs rounded-md border bg-background px-2"
            >
              <option value="normal">Normal</option>
              <option value="bold">Bold</option>
            </select>
          </div>

          {/* Text Align */}
          <div className="space-y-1.5">
            <Label className="text-xs">Alignment</Label>
            <select
              value={props.textAlign ?? "left"}
              onChange={(e) => updateProperty("textAlign", e.target.value)}
              className="w-full h-8 text-xs rounded-md border bg-background px-2"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
        </>
      )}
    </div>
  );
}
