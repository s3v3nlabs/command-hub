// Lightweight markdown parser for message rendering
export function parseMarkdown(content: string): string {
  let html = content

  // Code blocks with syntax highlighting placeholder
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto"><code class="language-${lang || "text"}">${escapeHtml(code.trim())}</code></pre>`
  })

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-800 text-green-300 px-2 py-1 rounded">$1</code>')

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')

  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')

  // Links
  html = html.replace(
    /\[([^\]]+)\]$$([^)]+)$$/g,
    '<a href="$2" class="text-blue-400 hover:text-blue-300 underline">$1</a>',
  )

  // Line breaks
  html = html.replace(/\n/g, "<br>")

  return html
}

function escapeHtml(text: string): string {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}
