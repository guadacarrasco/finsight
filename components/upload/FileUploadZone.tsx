"use client";

import { useRef, useState, type DragEvent, type ChangeEvent } from "react";

const ALLOWED_EXTS = ["pdf", "csv", "png", "jpg", "jpeg"];
const MAX_BYTES = 6 * 1024 * 1024;

interface Props {
  onFilesAccepted: (files: File[]) => void;
  onFileRejected: (name: string, reason: string) => void;
  onAttemptStart?: () => void;
}

export default function FileUploadZone({ onFilesAccepted, onFileRejected, onAttemptStart }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  function validate(files: FileList | File[]) {
    onAttemptStart?.();
    const accepted: File[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!ALLOWED_EXTS.includes(ext)) {
        onFileRejected(file.name, `Unsupported type .${ext}. Accepted: PDF, CSV, PNG, JPG.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        onFileRejected(
          file.name,
          `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 6 MB.`
        );
        continue;
      }
      accepted.push(file);
    }
    if (accepted.length > 0) onFilesAccepted(accepted);
  }

  function onDragEnter(e: DragEvent) {
    e.preventDefault();
    dragCounter.current += 1;
    if (dragCounter.current === 1) setIsDragging(true);
  }

  function onDragLeave(e: DragEvent) {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setIsDragging(false);
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) validate(e.dataTransfer.files);
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      validate(e.target.files);
      // reset so the same file can be re-selected
      e.target.value = "";
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload financial documents"
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={[
        "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors cursor-pointer select-none",
        isDragging
          ? "border-blue-500 bg-blue-50 text-blue-700"
          : "border-zinc-300 bg-zinc-50 text-zinc-500 hover:border-zinc-400 hover:bg-zinc-100",
      ].join(" ")}
    >
      <svg
        className="h-8 w-8 opacity-50"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
        />
      </svg>
      <p className="text-sm font-medium">
        {isDragging ? "Drop to upload" : "Drag & drop files here"}
      </p>
      <p className="text-xs opacity-70">or click to browse · PDF, CSV, PNG, JPG · max 6 MB</p>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.csv,.png,.jpg,.jpeg"
        multiple
        className="hidden"
        onChange={onChange}
      />
    </div>
  );
}
