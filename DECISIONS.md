# Architecture Decisions

## Day 1

### State management: React Context + useReducer
**Decision:** Use React Context with `useReducer` for shared state (documents, chat messages).
**Alternative considered:** Zustand.
**Why:** The app has exactly two state slices. A third-party store adds a dependency and indirection that isn't justified here. Context ships with React, has zero install cost, and the reducer pattern keeps state transitions explicit and traceable. For a prototype this size, complexity would count against us.

### Deployment: Replit Autoscale over Reserved VM
**Decision:** Target Replit Autoscale for the deployment environment.
**Alternative considered:** Replit Reserved VM.
**Why:** Autoscale scales to zero between uses — variable cost that matches a prototype with no background processing requirements. A Reserved VM runs (and bills) continuously even when idle. Cold start of 1–2s on Autoscale is acceptable for a demo. Required `output: "standalone"` in Next.js config and a `postbuild` step to copy static assets into the standalone bundle.

### Mock-contract-first API design
**Decision:** Define `lib/types.ts` and `lib/api.ts` before any UI component, with function signatures that match what the real Day 3 backend will expose (`uploadDocument`, `queryDocuments`, `listDocuments`). `uploadDocument` takes an `onStatusChange` callback so the caller (not the API module) owns dispatching state updates.
**Alternative considered:** Inline fetch calls in components, replace later.
**Why:** If mocks live behind the same interface as the real API, Day 3 is a URL swap — no component rewiring. The `onStatusChange` callback keeps the API module free of framework dependencies (no React imports, no dispatch coupling) and makes the signature stable across the mock→real transition.
