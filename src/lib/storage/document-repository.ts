import { db } from "./db";
import type { ManualDocument, PageData } from "@/types/document";

export async function getAllDocuments(): Promise<ManualDocument[]> {
  return db.documents.orderBy("updatedAt").reverse().toArray();
}

export async function getDocument(id: string): Promise<ManualDocument | undefined> {
  return db.documents.get(id);
}

export async function saveDocument(doc: ManualDocument): Promise<void> {
  await db.documents.put(doc);
}

export async function deleteDocument(id: string): Promise<void> {
  await db.transaction("rw", db.documents, db.pages, async () => {
    await db.pages.where("documentId").equals(id).delete();
    await db.documents.delete(id);
  });
}

export async function getPages(documentId: string): Promise<PageData[]> {
  return db.pages.where("documentId").equals(documentId).toArray();
}

export async function getPagesByIds(pageIds: string[]): Promise<PageData[]> {
  const pages = await db.pages.bulkGet(pageIds);
  return pages.filter((p): p is PageData => p !== undefined);
}

export async function savePage(page: PageData): Promise<void> {
  await db.pages.put(page);
}

export async function deletePage(pageId: string): Promise<void> {
  await db.pages.delete(pageId);
}

export async function saveDocumentWithPages(
  doc: ManualDocument,
  pages: PageData[]
): Promise<void> {
  await db.transaction("rw", db.documents, db.pages, async () => {
    await db.documents.put(doc);
    await db.pages.bulkPut(pages);
  });
}
