/**
 * REA tool policy. REA exposes ~229 MCP tools, including dynamic ones that
 * launch processes, attach debuggers (gdb/Frida), drive ADB devices or browsers.
 * The workbench is DEFAULT-DENY: only the explicit read-only static set below
 * runs without the staged ladder. Everything else is "dynamic" and requires
 * Stage 1 (RE_DYNAMIC_ENABLED=1) + Stage 2 (active scope authorizing
 * "sha256:<target>") + Stage 3 (attestation), and is audit-logged.
 */

export const REA_STATIC_READONLY = new Set<string>([
  "binary_session",
  "open_binary",
  "close_binary",
  "binary_overview",
  "list_procedures",
  "list_strings",
  "list_names",
  "list_segments",
  "list_documents",
  "search_procedures",
  "search_strings",
  "procedure_info",
  "procedure_assembly",
  "procedure_pseudo_code",
  "procedure_callers",
  "procedure_callees",
  "procedure_references",
  "resolve_containing_procedure",
  "read_function_instructions",
  "xrefs",
  "find_xrefs_to_name",
  "get_call_graph",
  "analyze_function",
  "compare_functions",
  "read_bytes",
  "search_bytes",
  "address_to_file_offset",
  "get_evidence_bundle",
  "inspect_analysis_view",
  "list_unknowns",
  "inspect_artifact",
  "inspect_binary_layout",
  "inspect_byte_entropy",
  "inspect_pe_imports",
  "inspect_pe_resources",
  "inspect_pe_load_config",
  "inspect_pe_certificates",
  "inspect_native_exports",
  "inspect_elf_notes",
  "inspect_go_binary",
  "inspect_rust_binary",
  "inspect_python_pyc",
  "inspect_android_package",
  "search_android_classes",
  "inspect_android_class",
  "inspect_android_method",
  "inspect_apk_signature",
  "inspect_firmware_regions",
  "inspect_wasm_artifact",
])

/** Name fragments that always mean execution / device / network side effects. */
const DYNAMIC_MARKERS = [
  "frida",
  "gdb",
  "debug",
  "adb",
  "capture",
  "observe",
  "start_",
  "install",
  "push_",
  "pull_",
  "execute_",
  "cutter_command",
  "instrument",
  "browser",
  "web_",
  "electron",
  "extract_",
  "set_",
  "unset_",
  "annotate",
  "comment",
  "import_",
  "export_",
]

export type ToolClass = "static" | "dynamic"

export function classifyReaTool(name: string): ToolClass {
  if (!REA_STATIC_READONLY.has(name)) return "dynamic"
  // defense in depth: an allowlisted name that somehow matches a dynamic marker is still gated
  if (DYNAMIC_MARKERS.some((m) => name.includes(m))) return "dynamic"
  return "static"
}

export function dynamicStage1Enabled(): boolean {
  return /^(1|true|yes)$/i.test(process.env.RE_DYNAMIC_ENABLED?.trim() || "")
}

/** Scope target string the operator must list in authorizedTargets. */
export function scopeTargetFor(sha256: string): string {
  return `sha256:${sha256.toLowerCase()}`
}
