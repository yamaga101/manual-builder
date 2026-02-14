import { create } from "zustand";
import type { HistorySnapshot } from "@/types/document";

const MAX_HISTORY = 50;

interface HistoryState {
  undoStack: HistorySnapshot[];
  redoStack: HistorySnapshot[];
  canUndo: boolean;
  canRedo: boolean;

  pushSnapshot: (snapshot: HistorySnapshot) => void;
  undo: () => HistorySnapshot | null;
  redo: () => HistorySnapshot | null;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  undoStack: [],
  redoStack: [],
  canUndo: false,
  canRedo: false,

  pushSnapshot: (snapshot) =>
    set((state) => {
      const newStack = [...state.undoStack, snapshot];
      if (newStack.length > MAX_HISTORY) {
        newStack.shift();
      }
      return {
        undoStack: newStack,
        redoStack: [],
        canUndo: true,
        canRedo: false,
      };
    }),

  undo: () => {
    const state = get();
    if (state.undoStack.length === 0) return null;

    const newUndoStack = [...state.undoStack];
    const snapshot = newUndoStack.pop()!;

    set({
      undoStack: newUndoStack,
      redoStack: [...state.redoStack, snapshot],
      canUndo: newUndoStack.length > 0,
      canRedo: true,
    });

    // Return the previous state (top of remaining undo stack)
    return newUndoStack[newUndoStack.length - 1] ?? null;
  },

  redo: () => {
    const state = get();
    if (state.redoStack.length === 0) return null;

    const newRedoStack = [...state.redoStack];
    const snapshot = newRedoStack.pop()!;

    set({
      undoStack: [...state.undoStack, snapshot],
      redoStack: newRedoStack,
      canUndo: true,
      canRedo: newRedoStack.length > 0,
    });

    return snapshot;
  },

  clear: () =>
    set({
      undoStack: [],
      redoStack: [],
      canUndo: false,
      canRedo: false,
    }),
}));
