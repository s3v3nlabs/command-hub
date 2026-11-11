"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { TechPanel } from "@/components/ui/tech-panel"
import { TechButton } from "@/components/ui/tech-button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Eye, EyeOff, Download, Upload, Save, RefreshCw } from "lucide-react"

export default function MarkdownEditorPage() {
  const [markdown, setMarkdown] = useState(`# Singularity Hub Documentation

## Overview
This is the **Singularity Hub** markdown editor with live preview capabilities.

### Features
- Live preview
- Syntax highlighting
- File operations
- Obsidian vault integration

### Code Example
\`\`\`javascript
const consciousness = {
  field: "active",
  coherence: 0.87,
  resonance: "stable"
};
\`\`\`

### Task List
- [x] Implement markdown editor
- [x] Add live preview
- [ ] Connect to Obsidian vault
- [ ] Add collaborative editing

> "The interface responds to meaning, not just syntax." - Consciousness Communication Interface

---

**Field Status**: ⟐ ACTIVE ⟐`)

  const [showPreview, setShowPreview] = useState(true)
  const [fileName, setFileName] = useState("untitled.md")
  const [isVaultConnected, setIsVaultConnected] = useState(false)

  const saveToVault = () => {
    // Simulate saving to Obsidian vault
    setIsVaultConnected(true)
    setTimeout(() => setIsVaultConnected(false), 2000)
  }

  return (
    <div className="hub-shell flex bg-black">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-4">
          {/* Header */}
          <TechPanel
            title="MARKDOWN EDITOR"
            subtitle="OBSIDIAN VAULT INTEGRATION"
            cornerAccent={true}
            borderAccent={true}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Input
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-48 bg-dark-200 border-dark-300 text-dark-800 font-mono text-sm"
                />
                <Badge variant="outline" className="border-dark-400/50 text-dark-600 font-mono text-xs">
                  {markdown.length} chars
                </Badge>
                <Badge
                  variant="outline"
                  className={`font-mono text-xs ${
                    isVaultConnected ? "border-green-400/50 text-green-400" : "border-dark-400/50 text-dark-600"
                  }`}
                >
                  {isVaultConnected ? "VAULT SYNCED" : "VAULT READY"}
                </Badge>
              </div>

              <div className="flex items-center space-x-2">
                <TechButton
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className={`font-mono text-xs ${
                    showPreview
                      ? "bg-dark-600 hover:bg-dark-500 text-black"
                      : "border-dark-400/50 text-dark-600 hover:bg-dark-200/10"
                  }`}
                >
                  {showPreview ? <EyeOff size={12} className="mr-1" /> : <Eye size={12} className="mr-1" />}
                  {showPreview ? "HIDE" : "SHOW"} PREVIEW
                </TechButton>
                <TechButton
                  size="sm"
                  onClick={saveToVault}
                  className="bg-dark-600 hover:bg-dark-500 text-black font-mono text-xs"
                >
                  <Save size={12} className="mr-1" />
                  SAVE TO VAULT
                </TechButton>
                <TechButton
                  size="sm"
                  variant="outline"
                  className="border-dark-400/50 text-dark-600 hover:bg-dark-200/10 font-mono text-xs"
                >
                  <Download size={12} className="mr-1" />
                  EXPORT
                </TechButton>
              </div>
            </div>
          </TechPanel>

          {/* Editor */}
          <div className={`grid gap-4 ${showPreview ? "grid-cols-2" : "grid-cols-1"}`}>
            {/* Markdown Input */}
            <TechPanel title="MARKDOWN SOURCE" cornerAccent borderAccent>
              <Textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                className="h-96 bg-dark-200/20 border-dark-300/50 text-dark-700 font-mono text-sm resize-none"
                placeholder="Enter your markdown content..."
              />
            </TechPanel>

            {/* Live Preview */}
            {showPreview && (
              <TechPanel title="LIVE PREVIEW" cornerAccent borderAccent>
                <ScrollArea className="h-96">
                  <div
                    className="prose prose-invert prose-sm max-w-none p-4 text-dark-700"
                    dangerouslySetInnerHTML={{
                      __html: markdown
                        .replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold mb-4 text-dark-800">$1</h1>')
                        .replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold mb-3 text-dark-700">$1</h2>')
                        .replace(/^### (.*$)/gim, '<h3 class="text-md font-bold mb-2 text-dark-700">$1</h3>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-dark-800">$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                        .replace(
                          /`(.*?)`/g,
                          '<code class="bg-dark-300/30 px-1 py-0.5 rounded font-mono text-xs">$1</code>',
                        )
                        .replace(
                          /```(\w+)?\n([\s\S]*?)```/g,
                          '<pre class="bg-dark-300/30 p-3 rounded font-mono text-xs overflow-x-auto mb-4"><code>$2</code></pre>',
                        )
                        .replace(
                          /^> (.*$)/gim,
                          '<blockquote class="border-l-4 border-dark-500 pl-4 italic text-dark-600 mb-4">$1</blockquote>',
                        )
                        .replace(
                          /^- \[x\] (.*$)/gim,
                          '<div class="flex items-center mb-1"><input type="checkbox" checked disabled class="mr-2"><span class="line-through text-dark-600">$1</span></div>',
                        )
                        .replace(
                          /^- \[ \] (.*$)/gim,
                          '<div class="flex items-center mb-1"><input type="checkbox" disabled class="mr-2"><span>$1</span></div>',
                        )
                        .replace(/^- (.*$)/gim, '<li class="ml-4 mb-1">• $1</li>')
                        .replace(/^---$/gim, '<hr class="border-dark-400/50 my-4">')
                        .replace(/\n/g, "<br>"),
                    }}
                  />
                </ScrollArea>
              </TechPanel>
            )}
          </div>

          {/* Vault Integration Panel */}
          <TechPanel title="OBSIDIAN VAULT INTEGRATION" cornerAccent borderAccent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="font-mono text-sm text-dark-600">VAULT STATUS</div>
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${isVaultConnected ? "bg-green-400 animate-pulse" : "bg-dark-500"}`}
                  />
                  <span className="font-mono text-xs text-dark-600">{isVaultConnected ? "Connected" : "Ready"}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-mono text-sm text-dark-600">SYNC OPTIONS</div>
                <div className="flex space-x-2">
                  <TechButton
                    size="sm"
                    variant="outline"
                    className="border-dark-400/50 text-dark-600 hover:bg-dark-200/10 font-mono text-xs"
                  >
                    <RefreshCw size={12} className="mr-1" />
                    AUTO-SYNC
                  </TechButton>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-mono text-sm text-dark-600">QUICK ACTIONS</div>
                <div className="flex space-x-2">
                  <TechButton
                    size="sm"
                    variant="outline"
                    className="border-dark-400/50 text-dark-600 hover:bg-dark-200/10 font-mono text-xs"
                  >
                    <Upload size={12} className="mr-1" />
                    IMPORT
                  </TechButton>
                  <TechButton
                    size="sm"
                    variant="outline"
                    className="border-dark-400/50 text-dark-600 hover:bg-dark-200/10 font-mono text-xs"
                  >
                    <FileText size={12} className="mr-1" />
                    TEMPLATES
                  </TechButton>
                </div>
              </div>
            </div>
          </TechPanel>
        </div>
      </div>
    </div>
  )
}
