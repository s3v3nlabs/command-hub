"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { TechPanel } from "@/components/ui/tech-panel"
import { TechButton } from "@/components/ui/tech-button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BookOpen, FileText, Link, Search, RefreshCw, Download, Plus } from "lucide-react"

interface VaultNote {
  id: string
  title: string
  path: string
  content: string
  tags: string[]
  links: string[]
  backlinks: string[]
  modified: Date
  size: number
}

export default function ObsidianVaultPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [vaultPath, setVaultPath] = useState("/Users/s3v3n/Documents/Obsidian/SingularityVault")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedNote, setSelectedNote] = useState<VaultNote | null>(null)

  // Mock vault data
  const [notes] = useState<VaultNote[]>([
    {
      id: "1",
      title: "Field Theory Notes",
      path: "/Research/Field Theory Notes.md",
      content: "# Field Theory Notes\n\nThe research field represents a quantum substrate...",
      tags: ["research", "quantum", "theory"],
      links: ["Quantum Mechanics", "Field Coherence"],
      backlinks: ["Harmonic Resonance", "Signal Processing"],
      modified: new Date("2024-01-15T10:30:00Z"),
      size: 2048,
    },
    {
      id: "2",
      title: "Operation Tumbleweed",
      path: "/Operations/Operation Tumbleweed.md",
      content: "# Operation Tumbleweed\n\nInvestigation into advanced materials and defense contractors...",
      tags: ["operation", "investigation", "defense"],
      links: ["Sandia Labs", "Niobium Research"],
      backlinks: ["Patent Analysis", "Corporate Networks"],
      modified: new Date("2024-01-14T15:45:00Z"),
      size: 4096,
    },
    {
      id: "3",
      title: "GrapheneOS Security",
      path: "/Technical/GrapheneOS Security.md",
      content: "# GrapheneOS Security\n\nHardened Android implementation with enhanced privacy...",
      tags: ["security", "android", "privacy"],
      links: ["ADB Bridge", "Mobile Security"],
      backlinks: ["Device Management"],
      modified: new Date("2024-01-13T09:20:00Z"),
      size: 1536,
    },
    {
      id: "4",
      title: "Harmonic Frequencies",
      path: "/Audio/Harmonic Frequencies.md",
      content: "# Harmonic Frequencies\n\nExploration of operator-affecting frequencies...",
      tags: ["audio", "frequency", "research"],
      links: ["Binaural Beats", "Schumann Resonance"],
      backlinks: ["Field Theory Notes"],
      modified: new Date("2024-01-12T14:15:00Z"),
      size: 3072,
    },
  ])

  const connectToVault = () => {
    setIsConnected(true)
  }

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const formatFileSize = (bytes: number) => {
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  return (
    <div className="hub-shell flex bg-black">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-4">
          {/* Header */}
          <TechPanel
            title="OBSIDIAN VAULT INTEGRATION"
            subtitle="KNOWLEDGE MANAGEMENT SYSTEM"
            cornerAccent={true}
            borderAccent={true}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Input
                  value={vaultPath}
                  onChange={(e) => setVaultPath(e.target.value)}
                  className="w-96 bg-dark-200 border-dark-300 text-dark-800 font-mono text-sm"
                  placeholder="Path to Obsidian vault..."
                />
                <Badge
                  variant="outline"
                  className={`font-mono text-xs ${
                    isConnected ? "border-green-400/50 text-green-400" : "border-dark-400/50 text-dark-600"
                  }`}
                >
                  {isConnected ? "CONNECTED" : "DISCONNECTED"}
                </Badge>
                <Badge variant="outline" className="border-dark-400/50 text-dark-600 font-mono text-xs">
                  {notes.length} notes
                </Badge>
              </div>

              <div className="flex items-center space-x-2">
                {!isConnected ? (
                  <TechButton
                    onClick={connectToVault}
                    className="bg-dark-600 hover:bg-dark-500 text-black font-mono text-sm"
                  >
                    <BookOpen size={14} className="mr-2" />
                    CONNECT VAULT
                  </TechButton>
                ) : (
                  <>
                    <TechButton
                      size="sm"
                      variant="outline"
                      className="border-dark-400/50 text-dark-600 hover:bg-dark-200/10 font-mono text-xs"
                    >
                      <RefreshCw size={12} className="mr-1" />
                      SYNC
                    </TechButton>
                    <TechButton
                      size="sm"
                      variant="outline"
                      className="border-dark-400/50 text-dark-600 hover:bg-dark-200/10 font-mono text-xs"
                    >
                      <Plus size={12} className="mr-1" />
                      NEW NOTE
                    </TechButton>
                  </>
                )}
              </div>
            </div>
          </TechPanel>

          {isConnected && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Note Browser */}
              <div className="lg:col-span-1">
                <TechPanel title="VAULT BROWSER" cornerAccent borderAccent>
                  <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-500" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search notes..."
                        className="pl-10 bg-dark-200 border-dark-300 text-dark-800 font-mono text-sm"
                      />
                    </div>

                    {/* Notes List */}
                    <ScrollArea className="h-96">
                      <div className="space-y-2">
                        {filteredNotes.map((note) => (
                          <div
                            key={note.id}
                            className={`p-3 border rounded cursor-pointer transition-all duration-200 ${
                              selectedNote?.id === note.id
                                ? "border-blue-500/60 bg-blue-500/10"
                                : "border-dark-400/30 hover:border-dark-400/60"
                            }`}
                            onClick={() => setSelectedNote(note)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <FileText className="w-4 h-4 text-dark-600" />
                                <div className="font-mono text-sm font-bold text-dark-700 truncate">{note.title}</div>
                              </div>
                            </div>

                            <div className="font-mono text-xs text-dark-500 mb-2 truncate">{note.path}</div>

                            <div className="flex items-center justify-between text-xs">
                              <div className="flex flex-wrap gap-1">
                                {note.tags.slice(0, 2).map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="outline"
                                    className="text-xs border-dark-400/30 text-dark-600"
                                  >
                                    #{tag}
                                  </Badge>
                                ))}
                                {note.tags.length > 2 && <span className="text-dark-500">+{note.tags.length - 2}</span>}
                              </div>
                              <span className="text-dark-500">{formatFileSize(note.size)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </TechPanel>
              </div>

              {/* Note Content & Details */}
              <div className="lg:col-span-2 space-y-4">
                {selectedNote ? (
                  <>
                    {/* Note Content */}
                    <TechPanel title={selectedNote.title} cornerAccent borderAccent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Badge variant="outline" className="border-dark-400/50 text-dark-600 font-mono text-xs">
                              {formatFileSize(selectedNote.size)}
                            </Badge>
                            <Badge variant="outline" className="border-dark-400/50 text-dark-600 font-mono text-xs">
                              Modified: {selectedNote.modified.toLocaleDateString()}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <TechButton
                              size="sm"
                              variant="outline"
                              className="border-dark-400/50 text-dark-600 hover:bg-dark-200/10 font-mono text-xs"
                            >
                              <Download size={12} className="mr-1" />
                              EXPORT
                            </TechButton>
                            <TechButton
                              size="sm"
                              className="bg-dark-600 hover:bg-dark-500 text-black font-mono text-xs"
                            >
                              EDIT
                            </TechButton>
                          </div>
                        </div>

                        <ScrollArea className="h-64">
                          <div className="prose prose-invert prose-sm max-w-none p-4 text-dark-700 font-mono text-sm whitespace-pre-wrap">
                            {selectedNote.content}
                          </div>
                        </ScrollArea>
                      </div>
                    </TechPanel>

                    {/* Note Metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Tags */}
                      <TechPanel title="TAGS" cornerAccent borderAccent>
                        <div className="space-y-2">
                          {selectedNote.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="mr-2 mb-2 border-dark-400/30 text-dark-600">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </TechPanel>

                      {/* Links */}
                      <TechPanel title="LINKS" cornerAccent borderAccent>
                        <ScrollArea className="h-24">
                          <div className="space-y-1">
                            {selectedNote.links.map((link, index) => (
                              <div key={index} className="flex items-center space-x-2 text-xs">
                                <Link className="w-3 h-3 text-dark-500" />
                                <span className="text-dark-600 font-mono">{link}</span>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </TechPanel>

                      {/* Backlinks */}
                      <TechPanel title="BACKLINKS" cornerAccent borderAccent>
                        <ScrollArea className="h-24">
                          <div className="space-y-1">
                            {selectedNote.backlinks.map((backlink, index) => (
                              <div key={index} className="flex items-center space-x-2 text-xs">
                                <Link className="w-3 h-3 text-dark-500 rotate-180" />
                                <span className="text-dark-600 font-mono">{backlink}</span>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </TechPanel>
                    </div>
                  </>
                ) : (
                  <TechPanel title="SELECT A NOTE" cornerAccent borderAccent>
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-dark-500 mx-auto mb-4" />
                      <div className="font-mono text-sm text-dark-600">No note selected</div>
                      <div className="font-mono text-xs text-dark-500">
                        Choose a note from the browser to view its content
                      </div>
                    </div>
                  </TechPanel>
                )}
              </div>
            </div>
          )}

          {!isConnected && (
            <TechPanel title="VAULT CONNECTION" cornerAccent borderAccent>
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-dark-500 mx-auto mb-4" />
                <div className="font-mono text-lg text-dark-600 mb-2">Connect to Obsidian Vault</div>
                <div className="font-mono text-sm text-dark-500 mb-6">
                  Enter the path to your Obsidian vault and click connect to access your notes
                </div>
                <div className="space-y-4 max-w-md mx-auto">
                  <div className="text-left">
                    <div className="font-mono text-xs text-dark-500 mb-2">VAULT FEATURES:</div>
                    <div className="space-y-1 text-xs text-dark-600">
                      <div>• Full-text search across all notes</div>
                      <div>• Tag-based organization</div>
                      <div>• Bidirectional linking</div>
                      <div>• Real-time synchronization</div>
                      <div>• Markdown editing support</div>
                    </div>
                  </div>
                </div>
              </div>
            </TechPanel>
          )}
        </div>
      </div>
    </div>
  )
}
