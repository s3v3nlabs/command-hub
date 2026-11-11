# Camtasia Command Hub v2 Stack Blueprint

_Status: future, optional package layout. This document is a planning reference only; it is not a migration plan._

This blueprint records the stack discussed in the Camtasia clips while preserving the existing Ghostlight reclaim UI. Any future adoption should be additive and separately reviewed.

## Planned stack

- **Workspace:** Turborepo barebones with pnpm workspaces.
- **Web app:** `apps/web` using the Next.js App Router, shadcn/ui, and Tailwind.
- **Shared UI:** `packages/ui` for reusable presentation components.
- **Database:** `packages/database` using Prisma with SQLite for a local-first option.
- **Agents:** `agents/planner` for planning and script generation; `agents/executor` for running approved work and returning stdout.
- **Scripts:** a dedicated `scripts/` area for repeatable setup, validation, and operational commands.

## Optional integrations

A future package may evaluate a Tauri or Electron desktop wrapper, Ollama or LM Studio, LangChain or AutoGen, local shell execution through Node `child_process`, Tesseract OCR, and browser extensions. These are optional and are not enabled by this blueprint.

## Non-migration guardrail

This document does **not** authorize a Turborepo migration, a rewrite of the live app, or removal/restyling/thinning of existing Ghostlight modules, routes, navigation, or panels. The current UI remains the source of truth until a separately approved additive package is ready.
