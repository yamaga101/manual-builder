import Dexie, { type EntityTable } from "dexie";
import type { ManualDocument, PageData } from "@/types/document";

const db = new Dexie("ManualBuilderDB") as Dexie & {
  documents: EntityTable<ManualDocument, "id">;
  pages: EntityTable<PageData, "id">;
};

db.version(1).stores({
  documents: "id, title, updatedAt",
  pages: "id, documentId",
});

export { db };
