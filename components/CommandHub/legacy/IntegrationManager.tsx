"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Puzzle,
  ExternalLink,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  Database,
  Shield,
  Globe,
  Search,
  Radio,
  Cpu,
  Map,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { speak } from "@/lib/audio"

interface Integration {
  id: string
  name: string
  description: string
  status: "active" | "inactive" | "error" | "pending"
  category: "data" | "security" | "analysis" | "communication" | "hardware"
  url: string
  icon: React.ReactNode
}

export default function IntegrationManager() {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: "int1",
      name: "Shodan API",
      description: "External device and server reconnaissance",
      status: "active",
      category: "data",
      url: "https://shodan.io",
      icon: <Globe className="h-5 w-5" />,
    },
    {
      id: "int2",
      name: "OSINT Framework",
      description: "Open source intelligence gathering",
      status: "active",
      category: "data",
      url: "https://osintframework.com",
      icon: <Search className="h-5 w-5" />,
    },
    {
      id: "int3",
      name: "Secure Vault",
      description: "Encrypted credential storage",
      status: "active",
      category: "security",
      url: "https://vault.example.com",
      icon: <Shield className="h-5 w-5" />,
    },
    {
      id: "int4",
      name: "PostgreSQL Database",
      description: "Primary data storage",
      status: "active",
      category: "data",
      url: "postgresql://localhost:5432",
      icon: <Database className="h-5 w-5" />,
    },
    {
      id: "int5",
      name: "RTL-SDR Interface",
      description: "Radio frequency monitoring",
      status: "inactive",
      category: "hardware",
      url: "http://localhost:8080",
      icon: <Radio className="h-5 w-5" />,
    },
    {
      id: "int6",
      name: "Kepler.gl",
      description: "Geospatial analysis platform",
      status: "error",
      category: "analysis",
      url: "https://kepler.gl",
      icon: <Map className="h-5 w-5" />,
    },
    {
      id: "int7",
      name: "AI Processing Engine",
      description: "Neural network for pattern recognition",
      status: "active",
      category: "analysis",
      url: "http://localhost:5000",
      icon: <Cpu className="h-5 w-5" />,
    },
    {
      id: "int8",
      name: "Secure Messaging",
      description: "End-to-end encrypted communication",
      status: "pending",
      category: "communication",
      url: "https://signal.org",
      icon: <Shield className="h-5 w-5" />,
    },
  ])

  const [filter, setFilter] = useState<string>("all")

  const toggleIntegration = (id: string) => {
    setIntegrations(
      integrations.map((integration) => {
        if (integration.id === id) {
          const newStatus = integration.status === "active" ? "inactive" : "active"
          speak(`${integration.name} ${newStatus}`)
          return {
            ...integration,
            status: newStatus,
          }
        }
        return integration
      }),
    )
  }

  const retryIntegration = (id: string) => {
    speak(`Retrying connection to ${integrations.find((i) => i.id === id)?.name}`)

    setIntegrations(
      integrations.map((integration) => {
        if (integration.id === id) {
          return {
            ...integration,
            status: "pending",
          }
        }
        return integration
      }),
    )

    // Simulate retry process
    setTimeout(() => {
      setIntegrations(
        integrations.map((integration) => {
          if (integration.id === id) {
            const success = Math.random() > 0.3
            speak(`Connection ${success ? "successful" : "failed"}`)
            return {
              ...integration,
              status: success ? "active" : "error",
            }
          }
          return integration
        }),
      )
    }, 2000)
  }

  const filteredIntegrations =
    filter === "all" ? integrations : integrations.filter((integration) => integration.category === filter)

  return (
    <Card className="bg-dark-50 border-dark-300 shadow-lg h-full">
      <CardHeader className="border-b border-dark-300 bg-dark-100 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Puzzle className="h-5 w-5 text-blue-500" />
          Integration Manager
        </CardTitle>
        <div className="flex gap-1">
          <button
            onClick={() => setFilter("all")}
            className={`px-2 py-1 text-xs rounded ${
              filter === "all" ? "bg-blue-900 text-blue-300" : "bg-dark-300 text-gray-400"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("data")}
            className={`px-2 py-1 text-xs rounded ${
              filter === "data" ? "bg-blue-900 text-blue-300" : "bg-dark-300 text-gray-400"
            }`}
          >
            Data
          </button>
          <button
            onClick={() => setFilter("security")}
            className={`px-2 py-1 text-xs rounded ${
              filter === "security" ? "bg-blue-900 text-blue-300" : "bg-dark-300 text-gray-400"
            }`}
          >
            Security
          </button>
          <button
            onClick={() => setFilter("analysis")}
            className={`px-2 py-1 text-xs rounded ${
              filter === "analysis" ? "bg-blue-900 text-blue-300" : "bg-dark-300 text-gray-400"
            }`}
          >
            Analysis
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          {filteredIntegrations.map((integration) => (
            <div key={integration.id} className="bg-dark-200 border border-dark-300 rounded-md overflow-hidden">
              <div className="p-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="bg-dark-300 p-2 rounded">{integration.icon}</div>
                  <div>
                    <div className="font-medium">{integration.name}</div>
                    <div className="text-xs text-gray-400">{integration.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={`
                    ${integration.status === "active" ? "bg-green-900/20 text-green-400 border-green-500" : ""}
                    ${integration.status === "inactive" ? "bg-gray-900/20 text-gray-400 border-gray-500" : ""}
                    ${integration.status === "error" ? "bg-red-900/20 text-red-400 border-red-500" : ""}
                    ${integration.status === "pending" ? "bg-amber-900/20 text-amber-400 border-amber-500" : ""}
                  `}
                  >
                    {integration.status === "active" && <Check className="h-3 w-3 mr-1" />}
                    {integration.status === "inactive" && <X className="h-3 w-3 mr-1" />}
                    {integration.status === "error" && <AlertTriangle className="h-3 w-3 mr-1" />}
                    {integration.status === "pending" && <RefreshCw className="h-3 w-3 mr-1 animate-spin" />}
                    {integration.status.charAt(0).toUpperCase() + integration.status.slice(1)}
                  </Badge>
                </div>
              </div>
              <div className="border-t border-dark-300 p-2 flex justify-between items-center bg-dark-300">
                <a
                  href={integration.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-xs flex items-center"
                >
                  Open Interface <ExternalLink className="h-3 w-3 ml-1" />
                </a>
                <div>
                  {integration.status === "error" ? (
                    <button
                      onClick={() => retryIntegration(integration.id)}
                      className="text-xs bg-amber-900/20 text-amber-400 border border-amber-500 px-2 py-1 rounded"
                    >
                      Retry
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleIntegration(integration.id)}
                      className={`text-xs px-2 py-1 rounded ${
                        integration.status === "active"
                          ? "bg-red-900/20 text-red-400 border border-red-500"
                          : "bg-green-900/20 text-green-400 border border-green-500"
                      }`}
                      disabled={integration.status === "pending"}
                    >
                      {integration.status === "active" ? "Disable" : "Enable"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
