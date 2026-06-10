"use client";

import type { ChatMessage as ChatMessageType } from "@/lib/types";
import SourcesPanel from "./SourcesPanel";

interface Props {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-2.5 text-sm text-white">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-zinc-200 bg-white px-4 py-2.5">
        {message.content ? (
          <p className="text-sm text-zinc-800">{message.content}</p>
        ) : (
          <span className="inline-flex gap-1 text-zinc-400">
            <span className="animate-bounce" style={{ animationDelay: "0ms" }}>·</span>
            <span className="animate-bounce" style={{ animationDelay: "150ms" }}>·</span>
            <span className="animate-bounce" style={{ animationDelay: "300ms" }}>·</span>
          </span>
        )}
        {message.sources && message.sources.length > 0 && (
          <SourcesPanel sources={message.sources} />
        )}
      </div>
    </div>
  );
}
