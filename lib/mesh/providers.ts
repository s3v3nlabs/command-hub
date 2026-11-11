/**
 * GPU mesh provider catalog — from docs/GPU_MESH.md + dimm-drive mesh peers.
 * Auth = operator-owned only. No live pods spun by defaults.
 * HOLD_VYRNA_UNSYNC · lattice_sync: false
 */

import { HOLD } from "./policy"

export type MeshRole = "reason" | "vision" | "train" | "sigil2vec" | "audio" | "render" | string

export type MeshProviderId =
  | "kaggle"
  | "colab"
  | "huggingface-zerogpu"
  | "paperspace"
  | "lightning"
  | "modal"
  | "runpod"
  | "vastai"

export type MeshProvider = {
  id: MeshProviderId
  moduleId: string
  name: string
  docsUrl: string
  auth: "operator-owned"
  forbidsBurnerAccounts: true
  quotaHint: string
  roles: MeshRole[]
  tier: "free-ish" | "credits" | "payg" | "spot"
  status: "stub" | "creds-pending" | "ready"
  envKeyHints: string[]
  notes: string
  hold: typeof HOLD
  lattice_sync: false
}

export const MESH_PROVIDERS: MeshProvider[] = [
  {
    id: "kaggle",
    moduleId: "mesh-kaggle",
    name: "Kaggle Notebooks",
    docsUrl: "https://www.kaggle.com/docs/efficient-gpu-usage",
    auth: "operator-owned",
    forbidsBurnerAccounts: true,
    quotaHint: "~30 GPU hrs / week (varies; Operator-reported)",
    roles: ["train", "reason"],
    tier: "free-ish",
    status: "stub",
    envKeyHints: ["KAGGLE_USERNAME", "KAGGLE_KEY"],
    notes: "Free-ish notebook pool. Use Operator account only. Destroy notebooks when idle.",
    hold: HOLD,
    lattice_sync: false,
  },
  {
    id: "colab",
    moduleId: "mesh-colab",
    name: "Google Colab",
    docsUrl: "https://colab.research.google.com/notebooks/intro.ipynb",
    auth: "operator-owned",
    forbidsBurnerAccounts: true,
    quotaHint: "Free tier GPU session limits (varies; Operator-reported)",
    roles: ["reason", "vision"],
    tier: "free-ish",
    status: "stub",
    envKeyHints: ["COLAB_OPERATOR_AUTHED"],
    notes: "Free notebook tier; availability varies. Operator Google account only. Set COLAB_OPERATOR_AUTHED=1 after browser SSO.",
    hold: HOLD,
    lattice_sync: false,
  },
  {
    id: "huggingface-zerogpu",
    moduleId: "mesh-hf-zerogpu",
    name: "Hugging Face ZeroGPU",
    docsUrl: "https://huggingface.co/docs/hub/spaces-gpus",
    auth: "operator-owned",
    forbidsBurnerAccounts: true,
    quotaHint: "Short demo ZeroGPU jobs (Operator-reported)",
    roles: ["sigil2vec", "vision"],
    tier: "free-ish",
    status: "stub",
    envKeyHints: ["HF_TOKEN"],
    notes: "Short demo-oriented ZeroGPU. Operator HF account only.",
    hold: HOLD,
    lattice_sync: false,
  },
  {
    id: "paperspace",
    moduleId: "mesh-paperspace",
    name: "Paperspace Gradient",
    docsUrl: "https://docs.digitalocean.com/products/paperspace/",
    auth: "operator-owned",
    forbidsBurnerAccounts: true,
    quotaHint: "Limited/free Gradient notebook (Operator-reported)",
    roles: ["render", "train"],
    tier: "free-ish",
    status: "stub",
    envKeyHints: ["PAPERSPACE_API_KEY"],
    notes: "Gradient free notebook may be public/limited. Operator seat only.",
    hold: HOLD,
    lattice_sync: false,
  },
  {
    id: "lightning",
    moduleId: "mesh-lightning",
    name: "Lightning AI",
    docsUrl: "https://lightning.ai/docs/",
    auth: "operator-owned",
    forbidsBurnerAccounts: true,
    quotaHint: "Trial-ish studio hours (Operator-reported)",
    roles: ["audio", "train"],
    tier: "free-ish",
    status: "stub",
    envKeyHints: ["LIGHTNING_API_KEY"],
    notes: "Trial-ish availability. Operator account only.",
    hold: HOLD,
    lattice_sync: false,
  },
  {
    id: "modal",
    moduleId: "mesh-modal",
    name: "Modal",
    docsUrl: "https://modal.com/docs",
    auth: "operator-owned",
    forbidsBurnerAccounts: true,
    quotaHint: "Credits-based hosted compute (Operator-reported)",
    roles: ["vision", "reason"],
    tier: "credits",
    status: "stub",
    envKeyHints: ["MODAL_TOKEN_ID", "MODAL_TOKEN_SECRET"],
    notes: "Credits-based. Env key names only — never echo secrets. Destroy when idle.",
    hold: HOLD,
    lattice_sync: false,
  },
  {
    id: "runpod",
    moduleId: "mesh-runpod",
    name: "RunPod",
    docsUrl: "https://docs.runpod.io/",
    auth: "operator-owned",
    forbidsBurnerAccounts: true,
    quotaHint: "Pay-as-you-go community GPUs (Operator-reported balance)",
    roles: ["reason", "train"],
    tier: "payg",
    status: "stub",
    envKeyHints: ["RUNPOD_API_KEY"],
    notes: "Community/cheap path. Destroy pods when idle. Operator key only.",
    hold: HOLD,
    lattice_sync: false,
  },
  {
    id: "vastai",
    moduleId: "mesh-vastai",
    name: "Vast.ai",
    docsUrl: "https://docs.vast.ai/",
    auth: "operator-owned",
    forbidsBurnerAccounts: true,
    quotaHint: "Spot marketplace credits (Operator-reported)",
    roles: ["train"],
    tier: "spot",
    status: "stub",
    envKeyHints: ["VAST_API_KEY"],
    notes: "Optional spot peer. Operator account only. Destroy instances when idle.",
    hold: HOLD,
    lattice_sync: false,
  },
]

export function listProviders(): MeshProvider[] {
  return MESH_PROVIDERS.map((p) => ({ ...p }))
}

export function getProvider(id: string): MeshProvider | undefined {
  return MESH_PROVIDERS.find((p) => p.id === id || p.moduleId === id)
}

export function providersForRole(role: MeshRole): MeshProvider[] {
  return MESH_PROVIDERS.filter((p) => p.roles.includes(role))
}

export function envKeysPresentFor(provider: MeshProvider): string[] {
  return provider.envKeyHints.filter((k) => Boolean(process.env[k]?.trim()))
}

/** Live status from Operator env — never claim ready without keys. */
export function resolveProviderStatus(provider: MeshProvider): MeshProvider["status"] {
  const hints = provider.envKeyHints
  if (hints.length === 0) return "stub"
  const present = envKeysPresentFor(provider)
  if (present.length === hints.length) return "ready"
  if (present.length > 0) return "creds-pending"
  return "stub"
}
