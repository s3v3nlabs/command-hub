"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Eye, Code, Download, Copy, RefreshCw } from "lucide-react"
import { speak } from "@/lib/audio"

export default function MarkdownEditor() {
  const [markdown, setMarkdown] = useState(`# BLACKFRAME Mission Report

## Operation Details

**Codename:** SILENT ECHO
**Date:** 2023-05-12
**Location:** [REDACTED]
**Team Lead:** Agent Corvus

## Mission Objectives

1. Infiltrate target facility
2. Extract data from secure terminal
3. Deploy passive monitoring device
4. Exfiltrate without detection

## Execution Summary

The team successfully infiltrated the target facility at 0200 hours using the previously identified blind spot in the security system. Agent Talon bypassed the electronic lock using the custom RFID spoofer.

> "The security system was exactly as our intelligence suggested. Minimal resistance encountered." - Agent Talon

### Data Extraction

We located the secure terminal in the east wing of the facility. The terminal was running an outdated version of the security software, which allowed us to exploit the known vulnerability:

\`\`\`
CVE-2022-31337 - Authentication Bypass
\`\`\`

Agent Raven successfully extracted 2.3GB of encrypted data, which has been transmitted to HQ for analysis.

### Monitoring Device

The passive monitoring device was deployed in the server room ventilation system. It should remain operational for approximately 45 days before battery depletion.

## Conclusion

Mission completed with 100% objective fulfillment and zero detection. Recommend continued monitoring of data streams from the deployed device.

![Mission Map](/placeholder.svg?height=200&width=400&query=tactical map with markers)

**Attachments:**
- [Facility Blueprints](#)
- [Extracted Data Hash](#)
- [Team Position Log](#)
`)
  const [preview, setPreview] = useState<string>("")
  const [viewMode, setViewMode] = useState<"edit" | "preview" | "split">("split")

  useEffect(() => {
    // In a real app, this would use a proper Markdown parser
    // This is a very simplified version for demonstration
    const html = simpleMarkdownToHtml(markdown)
    setPreview(html)
  }, [markdown])

  const simpleMarkdownToHtml = (md: string): string => {
    // This is a very simplified markdown parser for demonstration
    // In a real app, you would use a proper library like marked or remark

    let html = md

    // Headers
    html = html.replace(/^# (.*$)/gm, "<h1>$1</h1>")
    html = html.replace(/^## (.*$)/gm, "<h2>$1</h2>")
    html = html.replace(/^### (.*$)/gm, "<h3>$1</h3>")

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

    // Italic
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>")

    // Lists
    html = html.replace(/^\d+\. (.*$)/gm, "<li>$1</li>")
    html = html.replace(/<li>(.*)<\/li>/gm, (match) => "<ol>" + match + "</ol>")

    // Blockquotes
    html = html.replace(/^> (.*$)/gm, "<blockquote>$1</blockquote>")

    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")

    // Images
    html = html.replace(/!\[(.*?)\]$$(.*?)$$/g, '<img alt="$1" src="$2" style="max-width:100%;">')

    // Links
    html = html.replace(/\[(.*?)\]$$(.*?)$$/g, '<a href="$2">$1</a>')

    // Paragraphs
    html = html.replace(/^(?!<[a-z])(.*$)/gm, "<p>$1</p>")

    return html
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown)
    speak("Markdown copied to clipboard")
  }

  const handleDownload = () => {
    speak("Downloading markdown file")
    // In a real app, this would download the markdown as a file
    const blob = new Blob([markdown], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "mission-report.md"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="bg-dark-50 border-dark-300 shadow-lg h-full">
      <CardHeader className="border-b border-dark-300 bg-dark-100 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-500" />
          Markdown Editor
        </CardTitle>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("edit")}
            className={`text-gray-400 hover:text-white transition-colors ${viewMode === "edit" ? "text-white" : ""}`}
            title="Edit Mode"
          >
            <Code className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("preview")}
            className={`text-gray-400 hover:text-white transition-colors ${viewMode === "preview" ? "text-white" : ""}`}
            title="Preview Mode"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("split")}
            className={`text-gray-400 hover:text-white transition-colors ${viewMode === "split" ? "text-white" : ""}`}
            title="Split Mode"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={handleCopy}
            className="text-gray-400 hover:text-white transition-colors"
            title="Copy Markdown"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={handleDownload}
            className="text-gray-400 hover:text-white transition-colors"
            title="Download Markdown"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-0 h-[500px] flex flex-col">
        <div className={`flex h-full ${viewMode === "edit" ? "" : viewMode === "preview" ? "hidden" : ""}`}>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            className="w-full h-full bg-dark-200 border-none p-4 text-sm font-mono resize-none focus:outline-none"
            spellCheck="false"
          />
        </div>

        <div
          className={`h-full overflow-auto p-4 bg-white text-black ${
            viewMode === "preview" ? "" : viewMode === "edit" ? "hidden" : "w-1/2 border-l border-dark-300"
          }`}
          dangerouslySetInnerHTML={{ __html: preview }}
        />
      </CardContent>
    </Card>
  )
}
