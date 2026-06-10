"use client";

import { useState } from "react";
import { AppProvider, useAppContext } from "@/context/AppContext";
import { uploadDocument } from "@/lib/api";
import FileUploadZone from "@/components/upload/FileUploadZone";
import DocumentList from "@/components/upload/DocumentList";
import ChatInput from "@/components/chat/ChatInput";
import ChatMessage from "@/components/chat/ChatMessage";
import type { ChatMessage as ChatMessageType, SourceChunk } from "@/lib/types";

const MOCK_SOURCES: SourceChunk[] = [
  {
    documentId: "d1",
    documentName: "march_statement.pdf",
    excerpt: "03/04  WHOLE FOODS MARKET       $87.32",
    relevanceScore: 0.94,
  },
  {
    documentId: "d1",
    documentName: "march_statement.pdf",
    excerpt: "03/11  TRADER JOE'S             $63.15",
    relevanceScore: 0.91,
  },
];

const SEED_MESSAGES: ChatMessageType[] = [
  {
    id: "m1",
    role: "user",
    content: "How much did I spend on groceries in March?",
    createdAt: new Date().toISOString(),
  },
  {
    id: "m2",
    role: "assistant",
    content: "In March you spent $252.97 on groceries across 3 transactions.",
    sources: MOCK_SOURCES,
    createdAt: new Date().toISOString(),
  },
  {
    id: "m3",
    role: "assistant",
    content: "", // pending bubble — no content yet
    createdAt: new Date().toISOString(),
  },
];

function ChatTest() {
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

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-8">
      <h1 className="text-xl font-semibold text-zinc-800">Component verification</h1>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide">Upload</h2>
        <FileUploadZone
          onFilesAccepted={handleFilesAccepted}
          onFileRejected={(name, reason) => setUploadErrors((p) => [...p, `${name}: ${reason}`])}
        />
        {uploadErrors.map((e) => (
          <p key={e} className="text-sm text-red-600">{e}</p>
        ))}
        <DocumentList documents={state.documents} />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide">Chat messages</h2>
        <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          {SEED_MESSAGES.map((m) => (
            <ChatMessage key={m.id} message={m} />
          ))}
        </div>
        <ChatInput onSend={(q) => console.log("sent:", q)} disabled={false} />
        <ChatInput onSend={(q) => console.log("sent:", q)} disabled={true} />
        <p className="text-xs text-zinc-400">Top input: enabled · Bottom input: disabled state</p>
      </section>
    </div>
  );
}

export default function Page() {
  return (
    <AppProvider>
      <ChatTest />
    </AppProvider>
  );
}
