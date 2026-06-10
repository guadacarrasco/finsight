"use client";

import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import type { FinDocument, ChatMessage } from "@/lib/types";

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

interface AppState {
  documents: FinDocument[];
  messages: ChatMessage[];
}

const initialState: AppState = {
  documents: [],
  messages: [],
};

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type AppAction =
  | { type: "ADD_DOCUMENT"; payload: FinDocument }
  | { type: "UPDATE_DOCUMENT"; payload: { id: string; updates: Partial<FinDocument> } }
  | { type: "ADD_MESSAGE"; payload: ChatMessage }
  | { type: "UPDATE_MESSAGE"; payload: { id: string; updates: Partial<ChatMessage> } };

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "ADD_DOCUMENT":
      return { ...state, documents: [...state.documents, action.payload] };

    case "UPDATE_DOCUMENT":
      return {
        ...state,
        documents: state.documents.map((d) =>
          d.id === action.payload.id ? { ...d, ...action.payload.updates } : d
        ),
      };

    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.payload] };

    case "UPDATE_MESSAGE":
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.payload.id ? { ...m, ...action.payload.updates } : m
        ),
      };
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used inside AppProvider");
  return ctx;
}
