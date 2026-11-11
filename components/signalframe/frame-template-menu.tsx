"use client"

import { useState } from "react"
import { TechButton } from "@/components/ui/tech-button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  X,
  Shield,
  Search,
  MessageSquare,
  Code,
  Target,
  Network,
  AlertTriangle,
  Key,
  Filter,
  Grid,
  List,
} from "lucide-react"
import { frameTemplates, type FrameTemplate } from "@/lib/frame-templates"

interface FrameTemplateMenuProps {
  onSelect: (templateId: string) => void
  onClose: () => void
}

const iconMap = {
  Shield,
  Search,
  MessageSquare,
  Code,
  Target,
  Network,
  AlertTriangle,
  Key,
}

const categoryColors = {
  security: "bg-white/5 text-white/70 border-white/15",
  intelligence: "bg-white/5 text-white/70 border-white/15",
  communication: "bg-white/5 text-white/70 border-white/15",
  development: "bg-white/5 text-white/70 border-white/15",
  operations: "bg-white/5 text-white/70 border-white/15",
}

export function FrameTemplateMenu({ onSelect, onClose }: FrameTemplateMenuProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")

  const categories = [
    { id: "all", name: "All Templates", count: frameTemplates.length },
    { id: "security", name: "Security", count: frameTemplates.filter((t) => t.category === "security").length },
    {
      id: "intelligence",
      name: "Intelligence",
      count: frameTemplates.filter((t) => t.category === "intelligence").length,
    },
    {
      id: "communication",
      name: "Communication",
      count: frameTemplates.filter((t) => t.category === "communication").length,
    },
    {
      id: "development",
      name: "Development",
      count: frameTemplates.filter((t) => t.category === "development").length,
    },
    { id: "operations", name: "Operations", count: frameTemplates.filter((t) => t.category === "operations").length },
  ]

  const filteredTemplates = frameTemplates.filter((template) => {
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleTemplateSelect = (template: FrameTemplate) => {
    onSelect(template.id)
  }

  return (
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
      <div className="cyber-panel bg-dark-100/95 backdrop-blur-sm border border-dark-300/50 rounded-sm w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-300/30">
          <div>
            <div className="font-mono text-xl font-bold uppercase tracking-wider text-dark-800 mb-1">
              FRAME TEMPLATES
            </div>
            <div className="text-sm text-dark-600">Select a pre-configured workspace for your operation</div>
          </div>
          <div className="flex items-center space-x-2">
            <TechButton onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")} variant="outline" size="sm">
              {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
            </TechButton>
            <TechButton onClick={onClose} variant="outline" size="sm">
              <X className="w-4 h-4" />
            </TechButton>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-dark-300/30 p-4 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-500" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-dark-200/30 border border-dark-300/30 rounded-sm text-sm text-dark-800 placeholder-dark-500 focus:outline-none focus:border-white/40"
              />
            </div>

            {/* Categories */}
            <div className="space-y-1">
              <div className="text-xs font-mono uppercase tracking-wider text-dark-600 mb-2">Categories</div>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full text-left px-3 py-2 rounded-sm text-sm transition-colors ${
                    selectedCategory === category.id
                      ? "bg-white/10 text-white border border-white/30"
                      : "text-dark-600 hover:bg-dark-200/30 hover:text-dark-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{category.name}</span>
                    <span className="text-xs opacity-60">{category.count}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6">
            <ScrollArea className="h-full">
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) => {
                    const IconComponent = iconMap[template.icon as keyof typeof iconMap] || MessageSquare
                    return (
                      <div
                        key={template.id}
                        onClick={() => handleTemplateSelect(template)}
                        className="cyber-panel bg-dark-200/30 border border-dark-300/30 rounded-sm p-4 cursor-pointer hover:bg-dark-200/50 hover:border-dark-400/50 transition-all group"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="p-3 bg-dark-300/30 rounded-sm group-hover:bg-dark-300/50 transition-colors">
                            <IconComponent className="w-6 h-6 text-dark-700" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-mono text-sm font-bold uppercase tracking-wider text-dark-800 truncate">
                                {template.name}
                              </div>
                              <Badge variant={template.theme as any} className="text-xs ml-2 flex-shrink-0">
                                {template.category.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="text-xs text-dark-600 mb-3 line-clamp-2">{template.description}</div>
                            <div className="flex flex-wrap gap-1">
                              <span className="text-xs px-2 py-1 bg-white/5 text-white/70 rounded font-mono">
                                seat:{template.defaultSeat}
                              </span>
                              {template.defaultSettings.features.slice(0, 2).map((feature) => (
                                <span key={feature} className="text-xs px-2 py-1 bg-dark-400/20 text-dark-600 rounded">
                                  {feature}
                                </span>
                              ))}
                              {template.defaultSettings.features.length > 2 && (
                                <span className="text-xs px-2 py-1 bg-dark-400/20 text-dark-600 rounded">
                                  +{template.defaultSettings.features.length - 2}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTemplates.map((template) => {
                    const IconComponent = iconMap[template.icon as keyof typeof iconMap] || MessageSquare
                    return (
                      <div
                        key={template.id}
                        onClick={() => handleTemplateSelect(template)}
                        className="cyber-panel bg-dark-200/30 border border-dark-300/30 rounded-sm p-4 cursor-pointer hover:bg-dark-200/50 hover:border-dark-400/50 transition-all"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-dark-300/30 rounded-sm">
                            <IconComponent className="w-6 h-6 text-dark-700" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <div className="font-mono text-sm font-bold uppercase tracking-wider text-dark-800">
                                {template.name}
                              </div>
                              <Badge variant={template.theme as any} className="text-xs">
                                {template.category.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="text-xs text-dark-600 mb-2">{template.description}</div>
                            <div className="flex items-center space-x-4 text-xs text-dark-500">
                              <span className="font-mono text-white/60">seat:{template.defaultSeat}</span>
                              <span>{template.commands.length} commands</span>
                              <span>{template.defaultSettings.features.length} features</span>
                              <span>{template.initialMessages.length} initial messages</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {filteredTemplates.length === 0 && (
                <div className="flex items-center justify-center h-64 text-dark-600">
                  <div className="text-center">
                    <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <div className="text-lg font-semibold mb-2">No templates found</div>
                    <div className="text-sm">Try adjusting your search or category filter</div>
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-dark-300/30 p-4">
          <div className="flex justify-between items-center">
            <div className="text-xs text-dark-500">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? "s" : ""} available
            </div>
            <div className="flex space-x-2">
              <TechButton onClick={onClose} variant="outline">
                CANCEL
              </TechButton>
              <TechButton onClick={() => onSelect("custom")} variant="primary">
                CREATE CUSTOM FRAME
              </TechButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
