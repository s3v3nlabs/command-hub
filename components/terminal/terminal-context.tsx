"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

// Define available terminal themes
export type TerminalTheme = "default" | "midnight" | "matrix" | "amber" | "ghost"

// Define custom command alias type
export interface CommandAlias {
  alias: string
  command: string
  description?: string
}

// Define terminal session type
export interface TerminalSession {
  id: string
  name: string
  commands: Array<{
    command: string
    output: string
    timestamp: number
  }>
  startTime: number
  endTime?: number
}

// Define terminal sharing type
export interface TerminalSharing {
  active: boolean
  sessionId?: string
  viewers: Array<{
    id: string
    ip: string
    hostname: string
    port: number
    status: "idle" | "engaged"
    connectionTime: number
  }>
  encryptionEnabled: boolean
  vpnEnabled: boolean
  dnsProtectionEnabled: boolean
}

// Define terminal macro type
export interface TerminalMacro {
  id: string
  name: string
  commands: string[]
  description?: string
  createdAt: number
}

// Define terminal plugin type
export interface TerminalPlugin {
  id: string
  name: string
  version: string
  description: string
  enabled: boolean
  commands: string[]
  hooks: {
    beforeCommand?: (command: string) => string
    afterCommand?: (result: any) => any
    onInit?: () => void
    onExit?: () => void
  }
}

// Define API integration type
export interface ApiIntegration {
  id: string
  name: string
  endpoint: string
  authToken?: string
  enabled: boolean
  commands: string[]
}

// Define collaboration user type
export interface CollaborationUser {
  id: string
  name: string
  avatar?: string
  status: "active" | "idle" | "offline"
  color: string
  lastActivity: number
}

interface TerminalContextProps {
  theme: TerminalTheme
  setTheme: (theme: TerminalTheme) => void
  fontSize: "xs" | "sm" | "md"
  setFontSize: (size: "xs" | "sm" | "md") => void
  recording: boolean
  setRecording: (recording: boolean) => void
  recordingPath: string
  setRecordingPath: (path: string) => void
  recordingSessions: TerminalSession[]
  startRecording: (path: string) => void
  stopRecording: () => void
  commandAliases: CommandAlias[]
  addCommandAlias: (alias: string, command: string, description?: string) => void
  removeCommandAlias: (alias: string) => void
  getCommandByAlias: (alias: string) => string | null
  searchHistory: (query: string) => string[]
  sharing: TerminalSharing
  startSharing: () => void
  stopSharing: () => void
  toggleEncryption: () => void
  toggleVpn: () => void
  toggleDnsProtection: () => void
  macros: TerminalMacro[]
  createMacro: (name: string, commands: string[], description?: string) => void
  deleteMacro: (id: string) => void
  executeMacro: (id: string) => Promise<void>
  plugins: TerminalPlugin[]
  installPlugin: (plugin: Omit<TerminalPlugin, "id">) => void
  uninstallPlugin: (id: string) => void
  togglePlugin: (id: string) => void
  apiIntegrations: ApiIntegration[]
  addApiIntegration: (integration: Omit<ApiIntegration, "id">) => void
  removeApiIntegration: (id: string) => void
  toggleApiIntegration: (id: string) => void
  executeApiCommand: (command: string, args: string[]) => Promise<any>
  collaborationActive: boolean
  collaborationUsers: CollaborationUser[]
  startCollaboration: () => void
  stopCollaboration: () => void
  sendCollaborationMessage: (message: string) => void
  beautifyOutput: boolean
  toggleBeautifyOutput: () => void
  zshIntegration: boolean
  toggleZshIntegration: () => void
}

const TerminalContext = createContext<TerminalContextProps | undefined>(undefined)

export function TerminalProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<TerminalTheme>("default")
  const [fontSize, setFontSize] = useState<"xs" | "sm" | "md">("sm")
  const [recording, setRecording] = useState(false)
  const [recordingPath, setRecordingPath] = useState("/recordings")
  const [recordingSessions, setRecordingSessions] = useState<TerminalSession[]>([])
  const [currentSession, setCurrentSession] = useState<TerminalSession | null>(null)
  const [commandAliases, setCommandAliases] = useState<CommandAlias[]>([])
  const [sharing, setSharing] = useState<TerminalSharing>({
    active: false,
    viewers: [],
    encryptionEnabled: true,
    vpnEnabled: false,
    dnsProtectionEnabled: false,
  })
  const [macros, setMacros] = useState<TerminalMacro[]>([])
  const [plugins, setPlugins] = useState<TerminalPlugin[]>([])
  const [apiIntegrations, setApiIntegrations] = useState<ApiIntegration[]>([])
  const [collaborationActive, setCollaborationActive] = useState(false)
  const [collaborationUsers, setCollaborationUsers] = useState<CollaborationUser[]>([])
  const [beautifyOutput, setBeautifyOutput] = useState(false)
  const [zshIntegration, setZshIntegration] = useState(false)

  // Load saved preferences from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("terminal_theme") as TerminalTheme
      const savedFontSize = localStorage.getItem("terminal_font_size") as "xs" | "sm" | "md"
      const savedAliases = localStorage.getItem("terminal_aliases")
      const savedMacros = localStorage.getItem("terminal_macros")
      const savedPlugins = localStorage.getItem("terminal_plugins")
      const savedApiIntegrations = localStorage.getItem("terminal_api_integrations")
      const savedBeautifyOutput = localStorage.getItem("terminal_beautify_output")
      const savedZshIntegration = localStorage.getItem("terminal_zsh_integration")

      if (savedTheme) setTheme(savedTheme)
      if (savedFontSize) setFontSize(savedFontSize)
      if (savedAliases) setCommandAliases(JSON.parse(savedAliases))
      if (savedMacros) setMacros(JSON.parse(savedMacros))
      if (savedPlugins) setPlugins(JSON.parse(savedPlugins))
      if (savedApiIntegrations) setApiIntegrations(JSON.parse(savedApiIntegrations))
      if (savedBeautifyOutput) setBeautifyOutput(savedBeautifyOutput === "true")
      if (savedZshIntegration) setZshIntegration(savedZshIntegration === "true")
    }
  }, [])

  // Save preferences to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("terminal_theme", theme)
      localStorage.setItem("terminal_font_size", fontSize)
      localStorage.setItem("terminal_aliases", JSON.stringify(commandAliases))
      localStorage.setItem("terminal_macros", JSON.stringify(macros))
      localStorage.setItem("terminal_plugins", JSON.stringify(plugins))
      localStorage.setItem("terminal_api_integrations", JSON.stringify(apiIntegrations))
      localStorage.setItem("terminal_beautify_output", beautifyOutput.toString())
      localStorage.setItem("terminal_zsh_integration", zshIntegration.toString())
    }
  }, [theme, fontSize, commandAliases, macros, plugins, apiIntegrations, beautifyOutput, zshIntegration])

  // Start recording session
  const startRecording = (path: string) => {
    if (recording) return

    const newSession: TerminalSession = {
      id: `session-${Date.now()}`,
      name: `Session ${new Date().toLocaleString()}`,
      commands: [],
      startTime: Date.now(),
    }

    setCurrentSession(newSession)
    setRecordingPath(path)
    setRecording(true)
  }

  // Stop recording session
  const stopRecording = () => {
    if (!recording || !currentSession) return

    const completedSession: TerminalSession = {
      ...currentSession,
      endTime: Date.now(),
    }

    setRecordingSessions((prev) => [...prev, completedSession])
    setCurrentSession(null)
    setRecording(false)

    // In a real app, we would save the session to disk here
    console.log(`Session saved to ${recordingPath}/${completedSession.id}.json`)
  }

  // Add command alias
  const addCommandAlias = (alias: string, command: string, description?: string) => {
    setCommandAliases((prev) => {
      // Remove existing alias if it exists
      const filtered = prev.filter((a) => a.alias !== alias)
      return [...filtered, { alias, command, description }]
    })
  }

  // Remove command alias
  const removeCommandAlias = (alias: string) => {
    setCommandAliases((prev) => prev.filter((a) => a.alias !== alias))
  }

  // Get command by alias
  const getCommandByAlias = (alias: string): string | null => {
    const found = commandAliases.find((a) => a.alias === alias)
    return found ? found.command : null
  }

  // Search command history
  const searchHistory = (query: string): string[] => {
    // In a real app, this would search through a larger history
    // For now, we'll just return a mock result
    return ["network scan", "netmap topology", "status all", "firewall rules", "trace 192.168.1.1"].filter((cmd) =>
      cmd.includes(query),
    )
  }

  // Start sharing terminal
  const startSharing = () => {
    if (sharing.active) return

    // Generate random session ID
    const sessionId = `share-${Math.random().toString(36).substring(2, 9)}`

    // In a real app, this would set up a WebRTC connection or similar
    setSharing((prev) => ({
      ...prev,
      active: true,
      sessionId,
      viewers: [
        {
          id: `viewer-${Math.random().toString(36).substring(2, 9)}`,
          ip: "192.168.1.42",
          hostname: "agent-terminal",
          port: 443,
          status: "idle",
          connectionTime: Date.now(),
        },
      ],
    }))
  }

  // Stop sharing terminal
  const stopSharing = () => {
    if (!sharing.active) return

    setSharing((prev) => ({
      ...prev,
      active: false,
      sessionId: undefined,
      viewers: [],
    }))
  }

  // Toggle encryption
  const toggleEncryption = () => {
    setSharing((prev) => ({
      ...prev,
      encryptionEnabled: !prev.encryptionEnabled,
    }))
  }

  // Toggle VPN
  const toggleVpn = () => {
    setSharing((prev) => ({
      ...prev,
      vpnEnabled: !prev.vpnEnabled,
    }))
  }

  // Toggle DNS protection
  const toggleDnsProtection = () => {
    setSharing((prev) => ({
      ...prev,
      dnsProtectionEnabled: !prev.dnsProtectionEnabled,
    }))
  }

  // Create a new macro
  const createMacro = (name: string, commands: string[], description?: string) => {
    const newMacro: TerminalMacro = {
      id: `macro-${Date.now()}`,
      name,
      commands,
      description,
      createdAt: Date.now(),
    }

    setMacros((prev) => [...prev, newMacro])
  }

  // Delete a macro
  const deleteMacro = (id: string) => {
    setMacros((prev) => prev.filter((macro) => macro.id !== id))
  }

  // Execute a macro
  const executeMacro = async (id: string) => {
    const macro = macros.find((m) => m.id === id)
    if (!macro) return

    // In a real app, this would execute each command in sequence
    console.log(`Executing macro: ${macro.name}`)
    console.log(`Commands: ${macro.commands.join("; ")}`)
  }

  // Install a plugin
  const installPlugin = (plugin: Omit<TerminalPlugin, "id">) => {
    const newPlugin: TerminalPlugin = {
      ...plugin,
      id: `plugin-${Date.now()}`,
    }

    setPlugins((prev) => [...prev, newPlugin])
  }

  // Uninstall a plugin
  const uninstallPlugin = (id: string) => {
    setPlugins((prev) => prev.filter((plugin) => plugin.id !== id))
  }

  // Toggle a plugin
  const togglePlugin = (id: string) => {
    setPlugins((prev) =>
      prev.map((plugin) => {
        if (plugin.id === id) {
          return {
            ...plugin,
            enabled: !plugin.enabled,
          }
        }
        return plugin
      }),
    )
  }

  // Add API integration
  const addApiIntegration = (integration: Omit<ApiIntegration, "id">) => {
    const newIntegration: ApiIntegration = {
      ...integration,
      id: `api-${Date.now()}`,
    }

    setApiIntegrations((prev) => [...prev, newIntegration])
  }

  // Remove API integration
  const removeApiIntegration = (id: string) => {
    setApiIntegrations((prev) => prev.filter((integration) => integration.id !== id))
  }

  // Toggle API integration
  const toggleApiIntegration = (id: string) => {
    setApiIntegrations((prev) =>
      prev.map((integration) => {
        if (integration.id === id) {
          return {
            ...integration,
            enabled: !integration.enabled,
          }
        }
        return integration
      }),
    )
  }

  // Execute API command
  const executeApiCommand = async (command: string, args: string[]) => {
    // Find the API integration that handles this command
    const integration = apiIntegrations.find((api) => api.enabled && api.commands.includes(command))

    if (!integration) {
      throw new Error(`No API integration found for command: ${command}`)
    }

    // In a real app, this would make an API request
    console.log(`Executing API command: ${command}`)
    console.log(`Args: ${args.join(", ")}`)
    console.log(`Using API: ${integration.name} (${integration.endpoint})`)

    // Mock response
    return {
      success: true,
      data: {
        message: `API command executed successfully`,
        timestamp: Date.now(),
      },
    }
  }

  // Start collaboration
  const startCollaboration = () => {
    if (collaborationActive) return

    // In a real app, this would set up a WebSocket connection
    setCollaborationActive(true)
    setCollaborationUsers([
      {
        id: "user-1",
        name: "Agent Smith",
        avatar: "/avatars/agent-smith.jpg",
        status: "active",
        color: "#ff5555",
        lastActivity: Date.now(),
      },
      {
        id: "user-2",
        name: "Trinity",
        avatar: "/avatars/trinity.jpg",
        status: "idle",
        color: "#55ff55",
        lastActivity: Date.now() - 5 * 60 * 1000,
      },
    ])
  }

  // Stop collaboration
  const stopCollaboration = () => {
    if (!collaborationActive) return

    // In a real app, this would close the WebSocket connection
    setCollaborationActive(false)
    setCollaborationUsers([])
  }

  // Send collaboration message
  const sendCollaborationMessage = (message: string) => {
    if (!collaborationActive) return

    // In a real app, this would send a message over the WebSocket
    console.log(`Sending collaboration message: ${message}`)
  }

  // Toggle beautify output
  const toggleBeautifyOutput = () => {
    setBeautifyOutput((prev) => !prev)
  }

  // Toggle zsh integration
  const toggleZshIntegration = () => {
    setZshIntegration((prev) => !prev)
  }

  return (
    <TerminalContext.Provider
      value={{
        theme,
        setTheme,
        fontSize,
        setFontSize,
        recording,
        setRecording,
        recordingPath,
        setRecordingPath,
        recordingSessions,
        startRecording,
        stopRecording,
        commandAliases,
        addCommandAlias,
        removeCommandAlias,
        getCommandByAlias,
        searchHistory,
        sharing,
        startSharing,
        stopSharing,
        toggleEncryption,
        toggleVpn,
        toggleDnsProtection,
        macros,
        createMacro,
        deleteMacro,
        executeMacro,
        plugins,
        installPlugin,
        uninstallPlugin,
        togglePlugin,
        apiIntegrations,
        addApiIntegration,
        removeApiIntegration,
        toggleApiIntegration,
        executeApiCommand,
        collaborationActive,
        collaborationUsers,
        startCollaboration,
        stopCollaboration,
        sendCollaborationMessage,
        beautifyOutput,
        toggleBeautifyOutput,
        zshIntegration,
        toggleZshIntegration,
      }}
    >
      {children}
    </TerminalContext.Provider>
  )
}

export function useTerminal() {
  const context = useContext(TerminalContext)
  if (context === undefined) {
    throw new Error("useTerminal must be used within a TerminalProvider")
  }
  return context
}
