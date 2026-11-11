/** Client-side data transforms (CyberChef-style). Pure functions; no network. */

export type TransformId =
  | "b64encode"
  | "b64decode"
  | "urlencode"
  | "urldecode"
  | "hexencode"
  | "hexdecode"
  | "rot13"
  | "reverse"
  | "upper"
  | "lower"
  | "binencode"
  | "bindecode"
  | "jsonpretty"
  | "removespace"
  | "md5like"

function toHex(s: string): string {
  return Array.from(new TextEncoder().encode(s))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}
function fromHex(s: string): string {
  const clean = s.replace(/[^0-9a-f]/gi, "")
  const bytes = clean.match(/.{1,2}/g) || []
  return new TextDecoder().decode(new Uint8Array(bytes.map((b) => parseInt(b, 16))))
}

export const TRANSFORMS: Array<{ id: TransformId; label: string; group: string; fn: (s: string) => string }> = [
  { id: "b64encode", label: "Base64 encode", group: "encoding", fn: (s) => (typeof btoa !== "undefined" ? btoa(unescape(encodeURIComponent(s))) : Buffer.from(s).toString("base64")) },
  { id: "b64decode", label: "Base64 decode", group: "encoding", fn: (s) => { try { return decodeURIComponent(escape(atob(s.trim()))) } catch { return "[invalid base64]" } } },
  { id: "urlencode", label: "URL encode", group: "encoding", fn: (s) => encodeURIComponent(s) },
  { id: "urldecode", label: "URL decode", group: "encoding", fn: (s) => { try { return decodeURIComponent(s) } catch { return "[invalid]" } } },
  { id: "hexencode", label: "To hex", group: "encoding", fn: toHex },
  { id: "hexdecode", label: "From hex", group: "encoding", fn: fromHex },
  { id: "binencode", label: "To binary", group: "encoding", fn: (s) => Array.from(new TextEncoder().encode(s)).map((b) => b.toString(2).padStart(8, "0")).join(" ") },
  { id: "bindecode", label: "From binary", group: "encoding", fn: (s) => { const bits = s.replace(/[^01]/g, ""); const bytes = bits.match(/.{1,8}/g) || []; return new TextDecoder().decode(new Uint8Array(bytes.map((b) => parseInt(b, 2)))) } },
  { id: "rot13", label: "ROT13", group: "classic", fn: (s) => s.replace(/[a-z]/gi, (c) => { const base = c <= "Z" ? 65 : 97; return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base) }) },
  { id: "reverse", label: "Reverse", group: "classic", fn: (s) => s.split("").reverse().join("") },
  { id: "upper", label: "UPPERCASE", group: "case", fn: (s) => s.toUpperCase() },
  { id: "lower", label: "lowercase", group: "case", fn: (s) => s.toLowerCase() },
  { id: "removespace", label: "Strip whitespace", group: "text", fn: (s) => s.replace(/\s+/g, "") },
  { id: "jsonpretty", label: "JSON pretty", group: "text", fn: (s) => { try { return JSON.stringify(JSON.parse(s), null, 2) } catch { return "[invalid JSON]" } } },
]

export function applyChain(input: string, ids: TransformId[]): string {
  return ids.reduce((acc, id) => {
    const t = TRANSFORMS.find((x) => x.id === id)
    return t ? t.fn(acc) : acc
  }, input)
}
