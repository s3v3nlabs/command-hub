import path from "path"

/** Resolved lazily so tests (and alternate cwd deployments) bind correctly. */
export const rePaths = {
  root: () => path.join(process.cwd(), "local-data", "re-workbench"),
  targets: () => path.join(process.cwd(), "local-data", "re-workbench", "targets"),
  cache: () => path.join(process.cwd(), "local-data", "re-workbench", "cache"),
  ghidraProjects: () => path.join(process.cwd(), "local-data", "re-workbench", "ghidra-projects"),
  /** Existing deception-mesh quarantine (samples captured from decoys). */
  quarantine: () => path.join(process.cwd(), "local-data", "deception-quarantine"),
}
