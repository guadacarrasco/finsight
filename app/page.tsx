"use client";

import { useState } from "react";
import { AppProvider, useAppContext } from "@/context/AppContext";
import { uploadDocument } from "@/lib/api";
import FileUploadZone from "@/components/upload/FileUploadZone";
import DocumentList from "@/components/upload/DocumentList";

function UploadTest() {
  const { state, dispatch } = useAppContext();
  const [errors, setErrors] = useState<string[]>([]);

  async function handleFilesAccepted(files: File[]) {
    setErrors([]);
    for (const file of files) {
      const doc = await uploadDocument(file, (status) => {
        dispatch({ type: "UPDATE_DOCUMENT", payload: { id: doc.id, updates: { status } } });
      });
      dispatch({ type: "ADD_DOCUMENT", payload: doc });
    }
  }

  function handleFileRejected(name: string, reason: string) {
    setErrors((prev) => [...prev, `${name}: ${reason}`]);
  }

  return (
    <div className="mx-auto max-w-md p-8 space-y-4">
      <h1 className="text-xl font-semibold text-zinc-800">Upload test</h1>
      <FileUploadZone
        onFilesAccepted={handleFilesAccepted}
        onFileRejected={handleFileRejected}
      />
      {errors.map((e) => (
        <p key={e} className="text-sm text-red-600">{e}</p>
      ))}
      <DocumentList documents={state.documents} />
    </div>
  );
}

export default function Page() {
  return (
    <AppProvider>
      <UploadTest />
    </AppProvider>
  );
}
