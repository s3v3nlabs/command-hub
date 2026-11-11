"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { TechPanel } from "@/components/ui/tech-panel"
import { TechButton } from "@/components/ui/tech-button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileJson, Check, X, Download, Upload, RefreshCw, Search } from "lucide-react"

export default function JSONManagerPage() {
  const [jsonInput, setJsonInput] = useState(`{
  "consciousness": {
    "field": "active",
    "coherence": 0.87,
    "resonance": "stable",
    "nodes": [
      {
        "id": "terminal-1",
        "type": "consciousness-interface",
        "status": "online",
        "frequency": 42
      },
      {
        "id": "heimdal-1", 
        "type": "security-monitor",
        "status": "active",
        "threats": []
      }
    ]
  },
  "system": {
    "version": "3.7.2",
    "modules": {
      "graphene_bridge": true,
      "obsidian_vault": true,
      "harmonic_calibration": true
    }
  }
}`)

  const [isValid, setIsValid] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [fileName, setFileName] = useState("config.json")

  const validateJSON = (value: string) => {
    try {
      JSON.parse(value)
      setIsValid(true)
      setError("")
    } catch (err) {
      setIsValid(false)
      setError(err instanceof Error ? err.message : "Invalid JSON")
    }
  }

  const handleInputChange = (value: string) => {
    setJsonInput(value)
    validateJSON(value)
  }

  const formatJSON = () => {
    try {
      const parsed = JSON.parse(jsonInput)
      const formatted = JSON.stringify(parsed, null, 2)
      setJsonInput(formatted)
      setIsValid(true)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot format invalid JSON")
    }
  }

  const minifyJSON = () => {
    try {
      const parsed = JSON.parse(jsonInput)
      const minified = JSON.stringify(parsed)
      setJsonInput(minified)
      setIsValid(true)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot minify invalid JSON")
    }
  }

  const getJSONStats = () => {
    try {
      const parsed = JSON.parse(jsonInput)
      const countKeys = (obj: any): number => {
        let count = 0
        for (const key in obj) {
          count++
          if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
            count += countKeys(obj[key])
          }
        }
        return count
      }

      return {
        keys: countKeys(parsed),
        size: new Blob([jsonInput]).size,
        lines: jsonInput.split("\n").length,
      }
    } catch {
      return { keys: 0, size: 0, lines: 0 }
    }
  }

  const stats = getJSONStats()

  return (
    <div className="hub-shell flex bg-black">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-4">
          {/* Header */}
          <TechPanel
            title="JSON MANAGER"
            subtitle="CONFIGURATION & DATA PROCESSING"
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
                <Badge
                  variant="outline"
                  className={`font-mono text-xs ${
                    isValid ? "border-green-400/50 text-green-400" : "border-red-400/50 text-red-400"
                  }`}
                >
                  {isValid ? (
                    <>
                      <Check size={12} className="mr-1" />
                      VALID JSON
                    </>
                  ) : (
                    <>
                      <X size={12} className="mr-1" />
                      INVALID JSON
                    </>
                  )}
                </Badge>
                <Badge variant="outline" className="border-dark-400/50 text-dark-600 font-mono text-xs">
                  {stats.keys} keys • {stats.lines} lines • {stats.size} bytes
                </Badge>
              </div>

              <div className="flex items-center space-x-2">
                <TechButton
                  size="sm"
                  onClick={formatJSON}
                  className="bg-dark-600 hover:bg-dark-500 text-black font-mono text-xs"
                >
                  <RefreshCw size={12} className="mr-1" />
                  FORMAT
                </TechButton>
                <TechButton
                  size="sm"
                  onClick={minifyJSON}
                  variant="outline"
                  className="border-dark-400/50 text-dark-600 hover:bg-dark-200/10 font-mono text-xs"
                >
                  MINIFY
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

          {/* Main Editor */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* JSON Editor */}
            <div className="lg:col-span-2">
              <TechPanel title="JSON EDITOR" cornerAccent borderAccent>
                <div className="space-y-4">
                  {/* Search */}
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-500" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search JSON keys..."
                        className="pl-10 bg-dark-200 border-dark-300 text-dark-800 font-mono text-sm"
                      />
                    </div>
                  </div>

                  {/* Editor */}
                  <Textarea
                    value={jsonInput}
                    onChange={(e) => handleInputChange(e.target.value)}
                    className="h-96 bg-dark-200/20 border-dark-300/50 text-dark-700 font-mono text-sm resize-none"
                    placeholder="Enter your JSON data..."
                  />

                  {/* Error Display */}
                  {!isValid && error && (
                    <div className="p-3 bg-red-400/10 border border-red-400/30 rounded text-red-400 font-mono text-sm">
                      <div className="flex items-center space-x-2">
                        <X size={16} />
                        <span>JSON Error:</span>
                      </div>
                      <div className="mt-1 text-xs">{error}</div>
                    </div>
                  )}
                </div>
              </TechPanel>
            </div>

            {/* Tools & Analysis */}
            <div className="space-y-4">
              {/* JSON Tools */}
              <TechPanel title="JSON TOOLS" cornerAccent borderAccent>
                <div className="space-y-3">
                  <TechButton
                    size="sm"
                    variant="outline"
                    className="w-full border-dark-400/50 text-dark-600 hover:bg-dark-200/10 font-mono text-xs"
                  >
                    <FileJson size={12} className="mr-2" />
                    VALIDATE SCHEMA
                  </TechButton>
                  <TechButton
                    size="sm"
                    variant="outline"
                    className="w-full border-dark-400/50 text-dark-600 hover:bg-dark-200/10 font-mono text-xs"
                  >
                    <RefreshCw size={12} className="mr-2" />
                    CONVERT TO YAML
                  </TechButton>
                  <TechButton
                    size="sm"
                    variant="outline"
                    className="w-full border-dark-400/50 text-dark-600 hover:bg-dark-200/10 font-mono text-xs"
                  >
                    <Upload size={12} className="mr-2" />
                    IMPORT FROM FILE
                  </TechButton>
                  <TechButton
                    size="sm"
                    variant="outline"
                    className="w-full border-dark-400/50 text-dark-600 hover:bg-dark-200/10 font-mono text-xs"
                  >
                    <Search size={12} className="mr-2" />
                    QUERY BUILDER
                  </TechButton>
                </div>
              </TechPanel>

              {/* JSON Analysis */}
              <TechPanel title="ANALYSIS" cornerAccent borderAccent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-mono text-xs text-dark-500">TOTAL KEYS</span>
                    <span className="font-mono text-xs text-dark-700">{stats.keys}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono text-xs text-dark-500">FILE SIZE</span>
                    <span className="font-mono text-xs text-dark-700">{stats.size} bytes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono text-xs text-dark-500">LINES</span>
                    <span className="font-mono text-xs text-dark-700">{stats.lines}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono text-xs text-dark-500">STATUS</span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        isValid ? "border-green-400/50 text-green-400" : "border-red-400/50 text-red-400"
                      }`}
                    >
                      {isValid ? "VALID" : "INVALID"}
                    </Badge>
                  </div>
                </div>
              </TechPanel>

              {/* Quick Templates */}
              <TechPanel title="TEMPLATES" cornerAccent borderAccent>
                <ScrollArea className="h-32">
                  <div className="space-y-2">
                    <button
                      onClick={() =>
                        handleInputChange('{\n  "name": "",\n  "version": "1.0.0",\n  "description": ""\n}')
                      }
                      className="w-full text-left p-2 rounded border border-dark-400/30 hover:border-dark-400/60 transition-colors"
                    >
                      <div className="font-mono text-xs text-dark-700">Package Config</div>
                      <div className="font-mono text-xs text-dark-500">Basic package.json structure</div>
                    </button>
                    <button
                      onClick={() =>
                        handleInputChange(
                          '{\n  "consciousness": {\n    "field": "active",\n    "coherence": 0.87\n  }\n}',
                        )
                      }
                      className="w-full text-left p-2 rounded border border-dark-400/30 hover:border-dark-400/60 transition-colors"
                    >
                      <div className="font-mono text-xs text-dark-700">Consciousness Config</div>
                      <div className="font-mono text-xs text-dark-500">Field coherence settings</div>
                    </button>
                    <button
                      onClick={() =>
                        handleInputChange(
                          '{\n  "api": {\n    "endpoint": "",\n    "key": "",\n    "timeout": 5000\n  }\n}',
                        )
                      }
                      className="w-full text-left p-2 rounded border border-dark-400/30 hover:border-dark-400/60 transition-colors"
                    >
                      <div className="font-mono text-xs text-dark-700">API Config</div>
                      <div className="font-mono text-xs text-dark-500">API configuration template</div>
                    </button>
                  </div>
                </ScrollArea>
              </TechPanel>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
