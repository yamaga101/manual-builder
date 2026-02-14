import { create } from "zustand";
import type { ManualDocument, PageData } from "@/types/document";

interface DocumentState {
  // Current document
  document: ManualDocument | null;
  pages: PageData[];
  activePageId: string | null;

  // Document list (home screen)
  documents: ManualDocument[];

  // Actions
  setDocument: (doc: ManualDocument) => void;
  setPages: (pages: PageData[]) => void;
  setActivePageId: (id: string) => void;
  setDocuments: (docs: ManualDocument[]) => void;

  updatePageCanvas: (pageId: string, canvasJSON: string) => void;
  updatePageThumbnail: (pageId: string, thumbnail: string) => void;

  addPage: (page: PageData) => void;
  deletePage: (pageId: string) => void;
  reorderPages: (pageIds: string[]) => void;
  duplicatePage: (pageId: string, newPage: PageData) => void;

  updateDocumentTitle: (title: string) => void;
  reset: () => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  document: null,
  pages: [],
  activePageId: null,
  documents: [],

  setDocument: (doc) => set({ document: doc }),
  setPages: (pages) => set({ pages }),
  setActivePageId: (id) => set({ activePageId: id }),
  setDocuments: (docs) => set({ documents: docs }),

  updatePageCanvas: (pageId, canvasJSON) =>
    set((state) => ({
      pages: state.pages.map((p) =>
        p.id === pageId ? { ...p, canvasJSON } : p
      ),
    })),

  updatePageThumbnail: (pageId, thumbnail) =>
    set((state) => ({
      pages: state.pages.map((p) =>
        p.id === pageId ? { ...p, thumbnail } : p
      ),
    })),

  addPage: (page) =>
    set((state) => ({
      pages: [...state.pages, page],
      document: state.document
        ? {
            ...state.document,
            pageIds: [...state.document.pageIds, page.id],
            updatedAt: Date.now(),
          }
        : null,
    })),

  deletePage: (pageId) =>
    set((state) => {
      const newPages = state.pages.filter((p) => p.id !== pageId);
      const newPageIds = state.document
        ? state.document.pageIds.filter((id) => id !== pageId)
        : [];
      const newActivePageId =
        state.activePageId === pageId
          ? newPages[0]?.id ?? null
          : state.activePageId;

      return {
        pages: newPages,
        activePageId: newActivePageId,
        document: state.document
          ? { ...state.document, pageIds: newPageIds, updatedAt: Date.now() }
          : null,
      };
    }),

  reorderPages: (pageIds) =>
    set((state) => {
      const pageMap = new Map(state.pages.map((p) => [p.id, p]));
      const reordered = pageIds
        .map((id) => pageMap.get(id))
        .filter((p): p is PageData => p !== undefined);
      return {
        pages: reordered,
        document: state.document
          ? { ...state.document, pageIds, updatedAt: Date.now() }
          : null,
      };
    }),

  duplicatePage: (pageId, newPage) =>
    set((state) => {
      const index = state.pages.findIndex((p) => p.id === pageId);
      const newPages = [...state.pages];
      newPages.splice(index + 1, 0, newPage);
      const newPageIds = newPages.map((p) => p.id);
      return {
        pages: newPages,
        activePageId: newPage.id,
        document: state.document
          ? { ...state.document, pageIds: newPageIds, updatedAt: Date.now() }
          : null,
      };
    }),

  updateDocumentTitle: (title) =>
    set((state) => ({
      document: state.document
        ? { ...state.document, title, updatedAt: Date.now() }
        : null,
    })),

  reset: () =>
    set({ document: null, pages: [], activePageId: null }),
}));
