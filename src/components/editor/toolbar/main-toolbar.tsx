"use client";

import {
  MousePointer2,
  Type,
  Square,
  Circle,
  ArrowRight,
  Highlighter,
  Pencil,
  ImagePlus,
  Diamond,
  Undo2,
  Redo2,
  Download,
  ZoomIn,
  ZoomOut,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { useCanvasStore } from "@/stores/canvas-store";
import { useHistoryStore } from "@/stores/history-store";
import { useCanvasRef } from "../canvas/canvas-context";
import { deserializeCanvas } from "@/lib/canvas/serialization";
import type { ToolType } from "@/types/document";

interface ToolButtonProps {
  tool: ToolType;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
}

function ToolButton({ tool, icon, label, shortcut }: ToolButtonProps) {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={activeTool === tool ? "default" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => setActiveTool(tool)}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          {label}
          {shortcut && (
            <span className="ml-2 text-muted-foreground text-xs">
              {shortcut}
            </span>
          )}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

interface MainToolbarProps {
  onExport: () => void;
  onImageUpload: () => void;
}

export function MainToolbar({ onExport, onImageUpload }: MainToolbarProps) {
  const zoom = useCanvasStore((s) => s.zoom);
  const setZoom = useCanvasStore((s) => s.setZoom);
  const canUndo = useHistoryStore((s) => s.canUndo);
  const canRedo = useHistoryStore((s) => s.canRedo);
  const undo = useHistoryStore((s) => s.undo);
  const redo = useHistoryStore((s) => s.redo);
  const canvasRef = useCanvasRef();

  const handleUndo = () => {
    const snapshot = undo();
    const canvas = canvasRef.current;
    if (snapshot && canvas) {
      deserializeCanvas(canvas, snapshot.canvasJSON);
    }
  };

  const handleRedo = () => {
    const snapshot = redo();
    const canvas = canvasRef.current;
    if (snapshot && canvas) {
      deserializeCanvas(canvas, snapshot.canvasJSON);
    }
  };

  return (
    <div className="flex items-center gap-1 border-b bg-background px-3 py-1.5">
      {/* Drawing tools */}
      <ToolButton
        tool="select"
        icon={<MousePointer2 className="h-4 w-4" />}
        label="Select"
        shortcut="V"
      />
      <ToolButton
        tool="text"
        icon={<Type className="h-4 w-4" />}
        label="Text"
        shortcut="T"
      />
      <ToolButton
        tool="rectangle"
        icon={<Square className="h-4 w-4" />}
        label="Rectangle"
        shortcut="R"
      />
      <ToolButton
        tool="ellipse"
        icon={<Circle className="h-4 w-4" />}
        label="Ellipse"
        shortcut="E"
      />

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Annotation tools */}
      <ToolButton
        tool="arrow"
        icon={<ArrowRight className="h-4 w-4" />}
        label="Arrow"
        shortcut="A"
      />
      <ToolButton
        tool="callout"
        icon={<MessageCircle className="h-4 w-4" />}
        label="Callout"
        shortcut="C"
      />
      <ToolButton
        tool="highlight"
        icon={<Highlighter className="h-4 w-4" />}
        label="Highlight"
        shortcut="H"
      />
      <ToolButton
        tool="freehand"
        icon={<Pencil className="h-4 w-4" />}
        label="Freehand"
        shortcut="F"
      />

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Image */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onImageUpload}
          >
            <ImagePlus className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Image upload</TooltipContent>
      </Tooltip>

      {/* Flowchart */}
      <ToolButton
        tool="flowchart-rect"
        icon={<Square className="h-4 w-4" />}
        label="Process"
      />
      <ToolButton
        tool="flowchart-diamond"
        icon={<Diamond className="h-4 w-4" />}
        label="Decision"
      />
      <ToolButton
        tool="flowchart-oval"
        icon={<Circle className="h-4 w-4" />}
        label="Start/End"
      />
      <ToolButton
        tool="connector"
        icon={<ArrowRight className="h-4 w-4" />}
        label="Connector"
      />

      <div className="flex-1" />

      {/* Undo/Redo */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={!canUndo}
            onClick={handleUndo}
          >
            <Undo2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={!canRedo}
            onClick={handleRedo}
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Zoom */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setZoom(zoom - 0.1)}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Zoom out</TooltipContent>
      </Tooltip>
      <span className="text-xs text-muted-foreground w-12 text-center">
        {Math.round(zoom * 100)}%
      </span>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setZoom(zoom + 0.1)}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Zoom in</TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Export */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onExport}>
            <Download className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Export PDF</TooltipContent>
      </Tooltip>
    </div>
  );
}
