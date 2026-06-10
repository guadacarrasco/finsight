"use client";

import { useEffect, useRef, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { queryDocuments } from "@/lib/api";
import ChatInput from "./ChatInput";
import ChatMessage from "./ChatMessage";
import type { ChatMessage as ChatMessageType } from "@/lib/types";

export default function ChatInterface() {
  const { state, dispatch } = useAppContext();
  const [pending, setPending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.messages]);

  async function handleSend(question: string) {
    const ts = Date.now();

    const userMsg: ChatMessageType = {
      id: `msg-${ts}-u`,
      role: "user",
      content: question,
      createdAt: new Date(ts).toISOString(),
    };
    dispatch({ type: "ADD_MESSAGE", payload: userMsg });

    const assistantId = `msg-${ts}-a`;
    dispatch({
      type: "ADD_MESSAGE",
      payload: {
        id: assistantId,
        role: "assistant",
        content: "", // empty → dots animation in ChatMessage
        createdAt: new Date(ts).toISOString(),
      },
    });
    setPending(true);

    try {
      const response = await queryDocuments(question);
      dispatch({
        type: "UPDATE_MESSAGE",
        payload: {
          id: assistantId,
          updates: { content: response.answer, sources: response.sources },
        },
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {state.messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="max-w-xs text-center text-sm text-zinc-400">
              Upload a financial document, then ask a question to get started.
            </p>
          </div>
        ) : (
          state.messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <ChatInput onSend={handleSend} disabled={pending} />
    </div>
  );
}
