"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllDocuments, deleteDocument } from "@/lib/storage/document-repository";
import type { ManualDocument } from "@/types/document";

export function DocumentList() {
  const [documents, setDocuments] = useState<ManualDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadDocuments = async () => {
    const docs = await getAllDocuments();
    setDocuments(docs);
    setLoading(false);
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleCreate = () => {
    const id = crypto.randomUUID();
    router.push(`/editor/${id}`);
  };

  const handleOpen = (id: string) => {
    router.push(`/editor/${id}`);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteDocument(id);
    await loadDocuments();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Your Manuals</h2>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Manual
        </Button>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No manuals yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first manual to get started
          </p>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Manual
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* New manual card */}
          <button
            onClick={handleCreate}
            className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors min-h-[200px]"
          >
            <Plus className="h-8 w-8" />
            <span className="text-sm font-medium">New Manual</span>
          </button>

          {/* Existing manuals */}
          {documents.map((doc) => (
            <div
              key={doc.id}
              onClick={() => handleOpen(doc.id)}
              className="group border rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            >
              {/* Thumbnail area */}
              <div className="aspect-[3/4] bg-muted/30 flex items-center justify-center">
                <FileText className="h-12 w-12 text-muted-foreground/50" />
              </div>

              {/* Info */}
              <div className="p-3 border-t">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium truncate">
                      {doc.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(doc.updatedAt)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {doc.pageIds.length} page(s)
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive"
                    onClick={(e) => handleDelete(e, doc.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
