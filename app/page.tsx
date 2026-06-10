"use client";

import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { uploadDocument } from "@/lib/api";
import FileUploadZone from "@/components/upload/FileUploadZone";
import DocumentList from "@/components/upload/DocumentList";
import ChatInterface from "@/components/chat/ChatInterface";
import DashboardCards from "@/components/dashboard/DashboardCards";

function AppShell() {
  const { state, dispatch } = useAppContext();
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  async function handleFilesAccepted(files: File[]) {
    setUploadErrors([]);
    for (const file of files) {
      const doc = await uploadDocument(file, (status) => {
        dispatch({ type: "UPDATE_DOCUMENT", payload: { id: doc.id, updates: { status } } });
      });
      dispatch({ type: "ADD_DOCUMENT", payload: doc });
    }
  }

  function handleFileRejected(name: string, reason: string) {
    setUploadErrors((prev) => [...prev, `${name}: ${reason}`]);
  }

  return (
    <div className="flex h-screen flex-col bg-zinc-50">
      {/* Header */}
      <header className="shrink-0 border-b border-zinc-200 bg-white px-6 py-3">
        <h1 className="text-lg font-semibold text-zinc-800">
          Fin<span className="text-blue-600">Sight</span>
        </h1>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden px-6 py-4 gap-4">
        {/* Dashboard cards */}
        <div className="shrink-0">
          <DashboardCards />
        </div>

        {/* Two-column main area */}
        <div className="flex flex-1 gap-4 overflow-hidden">
          {/* Left: documents */}
          <aside className="flex w-72 shrink-0 flex-col gap-3 overflow-y-auto">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Documents
            </h2>
            <FileUploadZone
              onFilesAccepted={handleFilesAccepted}
              onFileRejected={handleFileRejected}
              onAttemptStart={() => setUploadErrors([])}
            />
            {uploadErrors.map((e) => (
              <p key={e} className="text-xs text-red-600">{e}</p>
            ))}
            <DocumentList documents={state.documents} />
          </aside>

          {/* Right: chat */}
          <main className="flex flex-1 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white">
            <div className="shrink-0 border-b border-zinc-100 px-4 py-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Chat
              </h2>
            </div>
            <div className="flex flex-1 flex-col overflow-hidden">
              <ChatInterface />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return <AppShell />;
}
