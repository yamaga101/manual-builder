"use client";

import { DocumentList } from "@/components/home/document-list";
import { BookOpen } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-semibold">Manual Builder</h1>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">
        <DocumentList />
      </main>
    </div>
  );
}
