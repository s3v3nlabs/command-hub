/**
 * Role-based workspace presets. A workspace is a named operator role that
 * presets which modules are featured and a layout density hint. Pure data +
 * helpers; persistence is client-side (localStorage "hub-workspace").
 */

export type WorkspaceId = "red" | "blue" | "tiger" | "investigator" | "all"

export interface WorkspacePreset {
  id: WorkspaceId
  label: string
  tagline: string
  accent: string
  /** Featured module routes, in display order. */
  featured: string[]
  /** Layout density hint consumers may honor. */
  layout: "focused" | "wide" | "dense"
}

export const WORKSPACE_PRESETS: WorkspacePreset[] = [
  {
    id: "red",
    label: "Red Team",
    tagline: "Offense — recon → kill-chain → engagement reporting.",
    accent: "#ef4444",
    featured: [
      "/offsec",
      "/offsec/osint",
      "/offsec/hardware",
      "/offsec/c2",
      "/offsec/threat-field",
      "/offsec/engagements",
      "/reports",
    ],
    layout: "dense",
  },
  {
    id: "blue",
    label: "Blue Team",
    tagline: "Defense — Heimdall, ATT&CK heatmap, deception, audit.",
    accent: "#3b82f6",
    featured: [
      "/command-hub",
      "/offsec/attack-navigator",
      "/offsec/deception",
      "/offsec/replay",
      "/audit",
      "/privacy",
    ],
    layout: "wide",
  },
  {
    id: "tiger",
    label: "Tiger Team",
    tagline: "Full-spectrum purple — attack, detect, replay, report.",
    accent: "#a855f7",
    featured: [
      "/offsec",
      "/offsec/c2",
      "/offsec/attack-navigator",
      "/offsec/replay",
      "/offsec/threat-field",
      "/offsec/deception",
      "/reports",
    ],
    layout: "dense",
  },
  {
    id: "investigator",
    label: "Investigator",
    tagline: "OSINT, entity graph, evidence, intelligence.",
    accent: "#f59e0b",
    featured: [
      "/offsec/osint",
      "/offsec/graph",
      "/intelligence/cctv",
      "/offsec/toolkit",
      "/evidence-explorer",
      "/reports",
    ],
    layout: "wide",
  },
  {
    id: "all",
    label: "All Modules",
    tagline: "No preset — show everything.",
    accent: "#64748b",
    featured: [],
    layout: "wide",
  },
]

export function getWorkspace(id: string | null | undefined): WorkspacePreset {
  return WORKSPACE_PRESETS.find((w) => w.id === id) || WORKSPACE_PRESETS[WORKSPACE_PRESETS.length - 1]
}

export function isWorkspaceId(v: unknown): v is WorkspaceId {
  return typeof v === "string" && WORKSPACE_PRESETS.some((w) => w.id === v)
}

/**
 * Given the live module list (route -> manifest), return the featured modules
 * for a workspace, preserving preset order and dropping unknown routes.
 */
export function resolveFeatured<T extends { route?: string }>(
  workspace: WorkspacePreset,
  modules: T[],
): T[] {
  if (!workspace.featured.length) return modules
  const byRoute = new Map(modules.filter((m) => m.route).map((m) => [m.route as string, m]))
  const out: T[] = []
  for (const r of workspace.featured) {
    const m = byRoute.get(r)
    if (m) out.push(m)
  }
  return out
}
