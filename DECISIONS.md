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

### Replit import hijack — rollback over accept
**Decision:** Rolled back the Replit workspace to the baseline checkpoint
after the platform's agent auto-launched a Next.js → Vite migration on
import.
**Alternative considered:** Accepting the migration and continuing on Vite.
**Why:** The Next.js App Router architecture is load-bearing for Days 2–3
(API routes, server components, deployment model). Vite is a SPA bundler
that would have required rebuilding the entire backend integration
strategy. Rolled back via checkpoint, then constrained the agent to wrap
the existing Next.js app inside Replit's artifact structure instead.

### Dual package manager corruption — root cause over symptoms
**Decision:** Removed `npm install &&` from the artifact build command
rather than continuing to fix individual missing packages.
**Alternative considered:** Adding each missing package to pnpm's
minimumReleaseAgeExclude list one by one.
**Why:** The publish pipeline ran `pnpm install` at workspace root, then
the build command ran `npm install` on top — npm rewrote pnpm's virtual
store layout, silently corrupting node_modules. Every package appeared
installed locally but failed in CI. Removing the redundant install step
fixed the entire class of errors. Build commands should build, not install.

### Replit package firewall — trusted publisher exclusion
**Decision:** Added `@next/*` wildcard to `minimumReleaseAgeExclude` in
pnpm-workspace.yaml rather than pinning individual package versions.
**Alternative considered:** Pinning eslint-config-next to an older version;
removing the entire eslint toolchain from the deploy manifest.
**Why:** Scaffolded hours after the Next.js 16.2.9 release. Replit's
firewall quarantines packages published within the last 24 hours as a
supply-chain protection measure. The transitive dependency tree
(@next/eslint-plugin-next, @next/swc-linux-arm64-gnu, etc.) has too many
sub-packages to pin individually. Excluding the @next/* publisher — same
pattern as the existing @replit/* exclusion — covers the full tree in one
entry. ESLint tooling was also removed from the deploy manifest since
`next build` doesn't run ESLint in Next 15+.

### Evidence over assurances — diagnostic-first debugging
**Decision:** When agent fixes stopped landing in the publish environment,
halted further fixes and demanded raw diagnostic output before proceeding.
**Alternative considered:** Continuing to apply fixes based on agent
verification claims.
**Why:** The agent verified builds using npm in its local sandbox while
the pipeline used pnpm with workspace semantics — different environments,
different results. Three consecutive "you're clear to republish" assurances
preceded three consecutive failures. Requiring raw `grep`, `ls`, and
`cat` output against the actual files in the pipeline path surfaced the
real root cause (dual package manager corruption) that targeted fixes
had missed. Lesson: when fixes stop landing, diagnose before fixing.