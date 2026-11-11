export function renderMarkdown(content: string): string {
  // Lightweight markdown parser for SignalFrame
  const html = content
    // Headers
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mb-3">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4">$1</h1>')

    // Code blocks
    .replace(
      /```(\w+)?\n([\s\S]*?)```/g,
      '<pre class="bg-gray-800 text-green-400 p-3 rounded-md overflow-x-auto"><code>$2</code></pre>',
    )

    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-gray-700 text-green-300 px-1 rounded">$1</code>')

    // Bold and italic
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')

    // Links
    .replace(/\[([^\]]+)\]$$([^)]+)$$/g, '<a href="$2" class="text-blue-400 hover:text-blue-300 underline">$1</a>')

    // Line breaks
    .replace(/\n/g, "<br>")

  return html
}

export function highlightSyntax(code: string, language: string): string {
  // Basic syntax highlighting for common languages
  const keywords: Record<string, string[]> = {
    javascript: ["function", "const", "let", "var", "if", "else", "for", "while", "return"],
    typescript: ["interface", "type", "function", "const", "let", "var", "if", "else", "for", "while", "return"],
    python: ["def", "class", "if", "else", "elif", "for", "while", "import", "from", "return"],
    bash: ["echo", "cd", "ls", "grep", "awk", "sed", "cat", "chmod", "sudo"],
  }

  let highlighted = code
  const langKeywords = keywords[language] || []

  langKeywords.forEach((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, "g")
    highlighted = highlighted.replace(regex, `<span class="text-blue-400">${keyword}</span>`)
  })

  // Strings
  highlighted = highlighted.replace(/"([^"]*)"/g, '<span class="text-green-400">"$1"</span>')
  highlighted = highlighted.replace(/'([^']*)'/g, "<span class=\"text-green-400\">'$1'</span>")

  // Comments
  highlighted = highlighted.replace(/\/\/.*$/gm, '<span class="text-gray-500">$&</span>')
  highlighted = highlighted.replace(/#.*$/gm, '<span class="text-gray-500">$&</span>')

  return highlighted
}

// Legacy export for backward compatibility
export const parseMarkdown = renderMarkdown
