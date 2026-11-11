/**
 * Lightweight, XSS-safe markdown → HTML.
 * Escape FIRST, then apply a small allowlisted set of replacements.
 * Links are restricted to http(s) and relative paths (no javascript:).
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function sanitizeHref(href: string): string | null {
  const h = href.trim()
  if (!h) return null
  // allow relative paths and http(s) only
  if (/^(https?:\/\/|\/|#)/i.test(h) && !/^\s*javascript\s*:/i.test(h)) {
    // block embedded javascript: in query tricks
    if (/javascript\s*:/i.test(h)) return null
    return h
  }
  return null
}

export function parseMarkdown(content: string): string {
  // Escape the whole input first so raw HTML never reaches the DOM.
  let html = escapeHtml(content)

  // Fenced code blocks (already escaped content)
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_m, lang, code) => {
    const language = (lang || "text").replace(/[^a-zA-Z0-9_-]/g, "")
    return `<pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto"><code class="language-${language}">${code.trim()}</code></pre>`
  })

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-800 text-green-300 px-2 py-1 rounded">$1</code>')

  // Bold / italic (on escaped text)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
  html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')

  // Links — markdown [text](href). Href is still escaped (&amp; etc.); decode for check.
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text, hrefEscaped) => {
    const hrefRaw = hrefEscaped
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
    const safe = sanitizeHref(hrefRaw)
    if (!safe) return text // drop unsafe links; keep the label
    return `<a href="${escapeHtml(safe)}" class="text-blue-400 hover:text-blue-300 underline" rel="noopener noreferrer" target="_blank">${text}</a>`
  })

  // Line breaks
  html = html.replace(/\n/g, "<br>")

  return html
}
