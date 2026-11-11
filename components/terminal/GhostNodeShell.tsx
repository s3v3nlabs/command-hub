"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Terminal, Play, Square, Save, Trash2, X, Cpu } from "lucide-react"

interface ScriptEntry {
  id: string
  name: string
  language: "python" | "bash" | "node"
  content: string
  lastRun?: string
  output?: string
  tags?: string[]
}

interface GhostNodeShellProps {
  onClose: () => void
}

export default function GhostNodeShell({ onClose }: GhostNodeShellProps) {
  const [currentScript, setCurrentScript] = useState("")
  const [selectedLanguage, setSelectedLanguage] = useState<"python" | "bash" | "node">("python")
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionOutput, setExecutionOutput] = useState("")
  const [savedScripts, setSavedScripts] = useState<ScriptEntry[]>([
    {
      id: "network-scan",
      name: "Network Scanner",
      language: "python",
      content: `#!/usr/bin/env python3
# ghost:anchor network-discovery
# ghost:note Advanced network reconnaissance tool

import socket
import threading
import subprocess
from datetime import datetime

def scan_port(host, port):
    """Scan a single port on target host"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except:
        return False

def ghost_scan(target, port_range="1-1000"):
    """GhostNode enhanced port scanner"""
    print(f"[GHOST] Scanning {target} ports {port_range}")
    
    start_port, end_port = map(int, port_range.split('-'))
    open_ports = []
    
    for port in range(start_port, end_port + 1):
        if scan_port(target, port):
            open_ports.append(port)
            print(f"[+] Port {port}: OPEN")
    
    return open_ports

# ghost:exec ghost_scan("127.0.0.1", "20-100")
if __name__ == "__main__":
    target = input("Target IP: ") or "127.0.0.1"
    ports = input("Port range (1-1000): ") or "1-1000"
    results = ghost_scan(target, ports)
    print(f"\\n[GHOST] Scan complete. Found {len(results)} open ports.")`,
      lastRun: "2024-01-15T10:30:00Z",
      tags: ["network", "reconnaissance", "security"],
    },
    {
      id: "system-info",
      name: "System Intelligence",
      language: "bash",
      content: `#!/bin/bash
# ghost:anchor system-recon
# ghost:note Comprehensive system intelligence gathering

echo "=== GHOST NODE SYSTEM INTELLIGENCE ==="
echo "Timestamp: $(date)"
echo "Hostname: $(hostname)"
echo "User: $(whoami)"
echo ""

echo "=== NETWORK INTERFACES ==="
ip addr show | grep -E "inet|link"
echo ""

echo "=== ACTIVE CONNECTIONS ==="
netstat -tuln | head -20
echo ""

echo "=== SYSTEM RESOURCES ==="
echo "Memory Usage:"
free -h
echo ""
echo "Disk Usage:"
df -h
echo ""
echo "CPU Info:"
lscpu | grep -E "Model name|CPU\$$s\$$|Architecture"
echo ""

echo "=== RUNNING PROCESSES ==="
ps aux | head -10
echo ""

echo "[GHOST] System intelligence gathering complete."`,
      lastRun: "2024-01-15T09:15:00Z",
      tags: ["system", "intelligence", "recon"],
    },
    {
      id: "crypto-tools",
      name: "Crypto Toolkit",
      language: "node",
      content: `// ghost:anchor crypto-operations
// ghost:note Advanced cryptographic operations toolkit

const crypto = require('crypto');
const fs = require('fs');

class GhostCrypto {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        console.log('[GHOST] Crypto toolkit initialized');
    }

    // ghost:exec encrypt data with quantum-resistant padding
    encrypt(text, password) {
        const salt = crypto.randomBytes(16);
        const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
        const iv = crypto.randomBytes(16);
        
        const cipher = crypto.createCipher(this.algorithm, key);
        cipher.setAAD(Buffer.from('ghost-node-auth'));
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return {
            encrypted,
            salt: salt.toString('hex'),
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex')
        };
    }

    // ghost:exec decrypt with integrity verification
    decrypt(encryptedData, password) {
        const { encrypted, salt, iv, authTag } = encryptedData;
        const key = crypto.pbkdf2Sync(password, Buffer.from(salt, 'hex'), 100000, 32, 'sha256');
        
        const decipher = crypto.createDecipher(this.algorithm, key);
        decipher.setAAD(Buffer.from('ghost-node-auth'));
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }

    // ghost:note Generate secure random tokens
    generateToken(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }
}

// Example usage
const ghost = new GhostCrypto();
const secret = "This is a classified message";
const password = process.env.GHOST_PASSPHRASE || "";

console.log('[GHOST] Encrypting message...');
const encrypted = ghost.encrypt(secret, password);
console.log('Encrypted:', encrypted);

console.log('[GHOST] Decrypting message...');
const decrypted = ghost.decrypt(encrypted, password);
console.log('Decrypted:', decrypted);

console.log('[GHOST] Generated token:', ghost.generateToken());`,
      lastRun: "2024-01-15T11:45:00Z",
      tags: ["crypto", "security", "encryption"],
    },
  ])
  const [selectedScript, setSelectedScript] = useState<string | null>(null)
  const [aiInterpretation, setAiInterpretation] = useState("")
  const [heimdalActive, setHeimdallActive] = useState(true)
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const terminalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [executionOutput])

  const executeScript = async () => {
    if (!currentScript.trim()) return

    setIsExecuting(true)
    const startTime = Date.now()
    const timestamp = new Date().toLocaleTimeString()

    // Add to command history
    setCommandHistory((prev) => [...prev.slice(-50), currentScript])
    setHistoryIndex(-1)

    try {
      // Simulate realistic script execution
      await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 2000))

      const executionTime = (Date.now() - startTime) / 1000

      // Parse GhostNode commands
      const ghostCommands = currentScript.match(/# ghost:(\w+)\s+(.+)/g) || []
      const executableLines = currentScript.match(/# ghost:exec\s+(.+)/g) || []

      let output = `[${timestamp}] GhostNode Shell v3.7.7 - Executing ${selectedLanguage} script\n`
      output += `[GHOST] Parsing script for GhostNode directives...\n`

      if (ghostCommands.length > 0) {
        output += `[GHOST] Found ${ghostCommands.length} GhostNode directives\n`
        ghostCommands.forEach((cmd) => {
          const [, directive, content] = cmd.match(/# ghost:(\w+)\s+(.+)/) || []
          output += `[GHOST] ${directive.toUpperCase()}: ${content}\n`
        })
      }

      if (executableLines.length > 0) {
        output += `[GHOST] Executing ${executableLines.length} marked lines\n`
      }

      // Language-specific execution simulation
      switch (selectedLanguage) {
        case "python":
          output += `Python 3.9.7 (GhostNode Enhanced)\n`
          output += `>>> exec(compile(script, '<ghost-node>', 'exec'))\n`
          if (currentScript.includes("scan_port") || currentScript.includes("socket")) {
            output += `[+] Network scan initiated\n`
            output += `[+] Port 22: OPEN (SSH)\n`
            output += `[+] Port 80: OPEN (HTTP)\n`
            output += `[+] Port 443: OPEN (HTTPS)\n`
            output += `[GHOST] Scan complete. Found 3 open ports.\n`
          }
          break
        case "bash":
          output += `bash-5.1$ source <(ghost-node-wrapper)\n`
          if (currentScript.includes("netstat") || currentScript.includes("ps aux")) {
            output += `=== GHOST NODE SYSTEM INTELLIGENCE ===\n`
            output += `Hostname: ghost-node-${Math.floor(Math.random() * 1000)}\n`
            output += `Active connections: ${Math.floor(Math.random() * 20) + 5}\n`
            output += `System load: ${(Math.random() * 2).toFixed(2)}\n`
          }
          break
        case "node":
          output += `Node.js v18.17.0 (GhostNode Runtime)\n`
          if (currentScript.includes("crypto") || currentScript.includes("encrypt")) {
            output += `[GHOST] Crypto toolkit initialized\n`
            output += `[GHOST] Encrypting message...\n`
            output += `Encrypted: { encrypted: '${Math.random().toString(36)}...', salt: '${Math.random().toString(36)}...' }\n`
            output += `[GHOST] Generated token: ${Math.random().toString(36).substring(2, 15)}\n`
          }
          break
      }

      output += `\n[GHOST] Execution completed in ${executionTime.toFixed(2)}s\n`
      output += `[GHOST] Memory usage: ${Math.floor(Math.random() * 50) + 10}MB\n`
      output += `[GHOST] Exit code: 0\n`

      setExecutionOutput((prev) => prev + output + "\n")

      // AI interpretation if Heimdall is active
      if (heimdalActive) {
        setTimeout(() => {
          const interpretations = [
            "Script executed successfully. GhostNode directives processed correctly.",
            "Network reconnaissance completed. No security violations detected.",
            "Cryptographic operations verified. Quantum-resistant encryption applied.",
            "System intelligence gathered. All parameters within normal ranges.",
            "Advanced scripting detected. Heimdal AI monitoring for optimization opportunities.",
            "GhostNode enhanced execution. Performance metrics logged for analysis.",
          ]
          setAiInterpretation(interpretations[Math.floor(Math.random() * interpretations.length)])
        }, 1000)
      }
    } catch (error) {
      setExecutionOutput((prev) => prev + `\n[${timestamp}] ERROR: ${error}\n`)
    } finally {
      setIsExecuting(false)
    }
  }

  const saveScript = () => {
    if (!currentScript.trim()) return

    const newScript: ScriptEntry = {
      id: `script-${Date.now()}`,
      name: `Script ${savedScripts.length + 1}`,
      language: selectedLanguage,
      content: currentScript,
      lastRun: new Date().toISOString(),
      output: executionOutput,
      tags: extractTags(currentScript),
    }

    setSavedScripts((prev) => [...prev, newScript])
  }

  const extractTags = (content: string): string[] => {
    const tags: string[] = []
    if (content.includes("socket") || content.includes("netstat")) tags.push("network")
    if (content.includes("crypto") || content.includes("encrypt")) tags.push("crypto")
    if (content.includes("ps aux") || content.includes("system")) tags.push("system")
    if (content.includes("ghost:")) tags.push("ghost-enhanced")
    return tags
  }

  const loadScript = (script: ScriptEntry) => {
    setCurrentScript(script.content)
    setSelectedLanguage(script.language)
    setSelectedScript(script.id)
    if (script.output) {
      setExecutionOutput(script.output)
    }
  }

  const deleteScript = (scriptId: string) => {
    setSavedScripts((prev) => prev.filter((s) => s.id !== scriptId))
    if (selectedScript === scriptId) {
      setSelectedScript(null)
    }
  }

  const clearTerminal = () => {
    setExecutionOutput("")
    setAiInterpretation("")
  }

  const getLanguageIcon = (lang: string) => {
    switch (lang) {
      case "python":
        return "🐍"
      case "bash":
        return "🔧"
      case "node":
        return "🟢"
      default:
        return "📄"
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      executeScript()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-7xl max-h-[95vh] bg-gray-900 border-gray-700">
        <CardHeader className="border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Terminal className="w-5 h-5 text-cyan-400" />
              <CardTitle className="text-white font-mono">GHOST NODE SHELL</CardTitle>
              <Badge variant="outline" className="text-xs font-mono">
                {selectedLanguage.toUpperCase()}
              </Badge>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${heimdalActive ? "bg-green-400" : "bg-red-400"}`} />
                <span className="text-xs text-gray-400 font-mono">HEIMDAL-BRIDGE</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setHeimdallActive(!heimdalActive)}
                size="sm"
                className={heimdalActive ? "bg-green-600 hover:bg-green-700" : "bg-gray-600 hover:bg-gray-700"}
              >
                <Cpu className="w-3 h-3 mr-1" />
                AI {heimdalActive ? "ON" : "OFF"}
              </Button>
              <Button onClick={onClose} variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 h-[80vh]">
          <div className="flex h-full">
            {/* Saved Scripts Sidebar */}
            <div className="w-80 border-r border-gray-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-mono text-sm">SAVED SCRIPTS</h3>
                <Button
                  size="sm"
                  onClick={saveScript}
                  disabled={!currentScript.trim()}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  <Save className="w-3 h-3 mr-1" />
                  SAVE
                </Button>
              </div>

              <ScrollArea className="h-[calc(100%-3rem)]">
                <div className="space-y-2">
                  {savedScripts.map((script) => (
                    <div
                      key={script.id}
                      className={`p-3 rounded border cursor-pointer transition-all ${
                        selectedScript === script.id
                          ? "border-cyan-500 bg-cyan-500/10"
                          : "border-gray-600 hover:border-gray-500"
                      }`}
                      onClick={() => loadScript(script)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{getLanguageIcon(script.language)}</span>
                          <span className="text-sm font-medium text-white truncate">{script.name}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteScript(script.id)
                          }}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>

                      <div className="text-xs text-gray-400 font-mono mb-2">
                        {script.language} •{" "}
                        {script.lastRun ? new Date(script.lastRun).toLocaleDateString() : "Never run"}
                      </div>

                      {script.tags && script.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {script.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Main Editor and Terminal */}
            <div className="flex-1 flex flex-col">
              {/* Language Selection and Controls */}
              <div className="border-b border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    {(["python", "bash", "node"] as const).map((lang) => (
                      <Button
                        key={lang}
                        size="sm"
                        variant={selectedLanguage === lang ? "default" : "outline"}
                        onClick={() => setSelectedLanguage(lang)}
                        className={`font-mono text-xs ${
                          selectedLanguage === lang
                            ? "bg-gray-700 text-white"
                            : "border-gray-600 text-gray-400 hover:text-white"
                        }`}
                      >
                        {getLanguageIcon(lang)} {lang.toUpperCase()}
                      </Button>
                    ))}
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={executeScript}
                      disabled={isExecuting || !currentScript.trim()}
                      className="bg-green-600 hover:bg-green-700 text-white font-mono text-xs"
                    >
                      {isExecuting ? <Square className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                      {isExecuting ? "EXECUTING..." : "EXECUTE"}
                    </Button>
                    <Button
                      onClick={clearTerminal}
                      variant="outline"
                      className="border-gray-600 text-gray-400 hover:text-white font-mono text-xs bg-transparent"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      CLEAR
                    </Button>
                  </div>
                </div>
              </div>

              {/* Script Editor */}
              <div className="flex-1 p-4">
                <Textarea
                  value={currentScript}
                  onChange={(e) => setCurrentScript(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Enter your ${selectedLanguage} script here...\n\nGhostNode Enhanced Commands:\n# ghost:note <description>\n# ghost:anchor <reference>\n# ghost:exec <command>\n\nPress Ctrl+Enter to execute`}
                  className="w-full h-full bg-black border-gray-600 text-green-400 font-mono text-sm resize-none"
                  style={{ fontFamily: 'Monaco, "Lucida Console", monospace' }}
                />
              </div>

              {/* Terminal Output */}
              <div className="border-t border-gray-700 p-4 h-64">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-mono text-sm flex items-center">
                    <Terminal className="w-4 h-4 mr-2" />
                    TERMINAL OUTPUT
                  </h3>
                  <div className="flex items-center space-x-2 text-xs font-mono text-gray-400">
                    <span>History: {commandHistory.length}</span>
                    <span>•</span>
                    <span>Status: {isExecuting ? "EXECUTING" : "READY"}</span>
                  </div>
                </div>

                <ScrollArea className="h-48">
                  <div
                    ref={terminalRef}
                    className="bg-black border border-gray-600 rounded p-3 h-full font-mono text-sm"
                  >
                    {executionOutput ? (
                      <pre className="text-green-400 whitespace-pre-wrap">{executionOutput}</pre>
                    ) : (
                      <div className="text-gray-500">
                        GhostNode Shell v3.7.7 - Advanced Scripting Terminal
                        <br />
                        Enhanced with AI integration and custom CLI syntax
                        <br />
                        <br />
                        Supported commands:
                        <br />• ghost:exec &lt;command&gt; --memory strict
                        <br />• ghost:ping &lt;target&gt; --trace
                        <br />• ghost:note "&lt;message&gt;"
                        <br />
                        <br />
                        Ready for script execution. Select language and enter code above.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* AI Interpretation */}
              {heimdalActive && aiInterpretation && (
                <div className="border-t border-gray-700 p-4">
                  <div className="bg-purple-900/20 border border-purple-700 rounded p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <Cpu className="w-4 h-4 text-purple-400" />
                      <span className="text-purple-400 font-mono text-sm">HEIMDAL AI INTERPRETATION</span>
                    </div>
                    <div className="text-purple-300 text-sm font-mono">{aiInterpretation}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
