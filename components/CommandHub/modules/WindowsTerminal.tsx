"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { TechPanel } from "@/components/ui/tech-panel"
import { TechButton } from "@/components/ui/tech-button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Terminal, X, Maximize2, Minimize2 } from "lucide-react"

interface WindowsSession {
  id: string
  name: string
  cwd: string
  history: WindowsEntry[]
  isActive: boolean
  shell: "cmd" | "powershell"
  environment: Record<string, string>
}

interface WindowsEntry {
  id: string
  command: string
  output: string
  timestamp: Date
  exitCode: number
  type: "command" | "system" | "error"
}

const mockWindowsFileSystem = {
  "C:\\": ["Program Files", "Program Files (x86)", "Windows", "Users", "temp"],
  "C:\\Users": ["Administrator", "s3v3n", "Public"],
  "C:\\Users\\s3v3n": ["Desktop", "Documents", "Downloads", "AppData"],
  "C:\\Users\\s3v3n\\Documents": ["CommandHub", "Projects", "notes.txt"],
  "C:\\Users\\s3v3n\\Desktop": ["shortcuts.lnk", "readme.txt"],
  "C:\\Program Files": ["Common Files", "Internet Explorer", "Windows NT"],
  "C:\\Windows": ["System32", "SysWOW64", "Temp", "explorer.exe"],
  "C:\\Windows\\System32": ["cmd.exe", "powershell.exe", "notepad.exe", "calc.exe"],
}

const cmdCommands: Record<string, (args: string[], cwd: string) => string> = {
  dir: (args, cwd) => {
    const path = args[0] || cwd
    const contents = mockWindowsFileSystem[path as keyof typeof mockWindowsFileSystem] || []
    const header = ` Volume in drive C has no label.\n Volume Serial Number is 1234-5678\n\n Directory of ${path}\n\n`
    const items = contents
      .map(
        (item) =>
          `${new Date().toLocaleDateString().padEnd(10)} ${new Date().toLocaleTimeString().padEnd(8)} <DIR>          ${item}`,
      )
      .join("\n")
    return header + items + `\n               ${contents.length} Dir(s)  12,345,678,901 bytes free`
  },
  cd: (args, cwd) => {
    if (!args[0]) return cwd
    return "" // Handled separately
  },
  echo: (args) => args.join(" "),
  type: (args) => {
    const file = args[0]
    if (file === "readme.txt") return "Welcome to CommandHub Windows Terminal\nThis is a simulated Windows environment."
    if (file === "notes.txt")
      return "Project notes:\n- Implement ADB bridge\n- Add camera streaming\n- Test GrapheneOS integration"
    return `The system cannot find the file specified.`
  },
  cls: () => "",
  ver: () => "Microsoft Windows [Version 10.0.19045.3570]",
  date: () => new Date().toLocaleDateString(),
  time: () => new Date().toLocaleTimeString(),
  whoami: () => "commandhub\\s3v3n",
  hostname: () => "COMMANDHUB-PC",
  ipconfig: (args) => {
    if (args.includes("/all")) {
      return `Windows IP Configuration\n\n   Host Name . . . . . . . . . . . . : COMMANDHUB-PC\n   Primary Dns Suffix  . . . . . . . :\n   Node Type . . . . . . . . . . . . : Hybrid\n\nEthernet adapter Ethernet:\n\n   Connection-specific DNS Suffix  . :\n   IPv4 Address. . . . . . . . . . . : 192.168.1.100\n   Subnet Mask . . . . . . . . . . . : 255.255.255.0\n   Default Gateway . . . . . . . . . : 192.168.1.1`
    }
    return `Windows IP Configuration\n\nEthernet adapter Ethernet:\n\n   IPv4 Address. . . . . . . . . . . : 192.168.1.100\n   Subnet Mask . . . . . . . . . . . : 255.255.255.0\n   Default Gateway . . . . . . . . . : 192.168.1.1`
  },
  tasklist: () =>
    `Image Name                     PID Session Name        Session#    Mem Usage\n========================= ======== ================ =========== ============\nSystem Idle Process              0 Services                   0          8 K\nSystem                           4 Services                   0        284 K\nsmss.exe                       372 Services                   0      1,036 K\ncsrss.exe                      500 Services                   0      4,128 K\nwinlogon.exe                   524 Console                    1      2,912 K`,
  systeminfo: () =>
    `Host Name:                 COMMANDHUB-PC\nOS Name:                   Microsoft Windows 10 Pro\nOS Version:                10.0.19045 N/A Build 19045\nOS Manufacturer:           Microsoft Corporation\nOS Configuration:          Standalone Workstation\nProcessor(s):              1 Processor(s) Installed.\n                          [01]: Intel64 Family 6 Model 142 Stepping 10 GenuineIntel ~2400 Mhz\nTotal Physical Memory:     16,384 MB\nAvailable Physical Memory: 8,192 MB`,
  help: () =>
    "Available commands: dir, cd, echo, type, cls, ver, date, time, whoami, hostname, ipconfig, tasklist, systeminfo, help, exit",
}

const powershellCommands: Record<string, (args: string[], cwd: string) => string> = {
  "Get-ChildItem": (args, cwd) => {
    const path = args[0] || cwd
    const contents = mockWindowsFileSystem[path as keyof typeof mockWindowsFileSystem] || []
    const header = `\n    Directory: ${path}\n\nMode                 LastWriteTime         Length Name\n----                 -------------         ------ ----`
    const items = contents
      .map(
        (item) =>
          `d-----        ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString().substring(0, 5)}                ${item}`,
      )
      .join("\n")
    return header + "\n" + items
  },
  "Get-Location": (args, cwd) => `\nPath\n----\n${cwd}\n`,
  "Write-Host": (args) => args.join(" "),
  "Get-Content": (args) => {
    const file = args[0]
    if (file === "readme.txt")
      return "Welcome to CommandHub PowerShell Terminal\nThis is a simulated Windows PowerShell environment."
    return `Get-Content : Cannot find path '${file}' because it does not exist.`
  },
  "Clear-Host": () => "",
  "Get-Date": () => new Date().toString(),
  "Get-ComputerInfo": () =>
    `WindowsProductName      : Windows 10 Pro\nWindowsVersion          : 2009\nTotalPhysicalMemory     : 17179869184\nCsProcessors            : {Intel(R) Core(TM) i7-10700K CPU @ 3.80GHz}\nCsNetworkAdapters       : {Ethernet}`,
  "Get-Process": () =>
    `Handles  NPM(K)    PM(K)      WS(K)     CPU(s)     Id  SI ProcessName\n-------  ------    -----      -----     ------     --  -- -----------\n    463      18     2284       4960       0.03   4856   1 ApplicationFrameHost\n    346      19     2412       5360       0.06   5024   1 Calculator\n   1056      44    13052      21060       1.25   3208   1 chrome`,
  "Get-Service": () =>
    `Status   Name               DisplayName\n------   ----               -----------\nRunning  AudioEndpointBu... Windows Audio Endpoint Builder\nRunning  Audiosrv           Windows Audio\nStopped  AxInstSV           ActiveX Installer (AxInstSV)\nRunning  BITS               Background Intelligent Transfer Ser...`,
  "Test-NetConnection": (args) => {
    const target = args[0] || "google.com"
    return `ComputerName     : ${target}\nRemoteAddress    : 142.250.191.14\nRemotePort       : 80\nInterfaceAlias   : Ethernet\nSourceAddress    : 192.168.1.100\nTcpTestSucceeded : True`
  },
  help: () =>
    "Available cmdlets: Get-ChildItem, Get-Location, Write-Host, Get-Content, Clear-Host, Get-Date, Get-ComputerInfo, Get-Process, Get-Service, Test-NetConnection, help, exit",
}

export default function WindowsTerminal() {
  const [sessions, setSessions] = useState<WindowsSession[]>([
    {
      id: "session-1",
      name: "CMD 1",
      cwd: "C:\\Users\\s3v3n",
      history: [
        {
          id: "1",
          command: "",
          output:
            "Microsoft Windows [Version 10.0.19045.3570]\n(c) Microsoft Corporation. All rights reserved.\n\nWelcome to CommandHub Windows Terminal",
          timestamp: new Date(),
          exitCode: 0,
          type: "system",
        },
      ],
      isActive: true,
      shell: "cmd",
      environment: {
        USERNAME: "s3v3n",
        USERPROFILE: "C:\\Users\\s3v3n",
        PATH: "C:\\Windows\\System32;C:\\Windows;C:\\Program Files",
        COMPUTERNAME: "COMMANDHUB-PC",
      },
    },
  ])
  const [activeSessionId, setActiveSessionId] = useState("session-1")
  const [currentCommand, setCurrentCommand] = useState("")
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isMaximized, setIsMaximized] = useState(false)
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0]

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [activeSession.history])

  useEffect(() => {
    inputRef.current?.focus()
  }, [activeSessionId])

  const executeCommand = () => {
    if (!currentCommand.trim()) return

    const command = currentCommand.trim()
    const [cmd, ...args] = command.split(" ")

    setCommandHistory((prev) => [...prev, command])
    setHistoryIndex(-1)

    let output = ""
    let exitCode = 0
    let newCwd = activeSession.cwd

    const commands = activeSession.shell === "cmd" ? cmdCommands : powershellCommands

    // Handle directory change
    if (
      (activeSession.shell === "cmd" && cmd.toLowerCase() === "cd") ||
      (activeSession.shell === "powershell" && cmd === "Set-Location")
    ) {
      const targetDir = args[0]
      if (!targetDir) {
        output = activeSession.cwd
      } else if (targetDir === "..") {
        const pathParts = activeSession.cwd.split("\\").filter(Boolean)
        pathParts.pop()
        newCwd = pathParts.length > 0 ? pathParts.join("\\") + "\\" : "C:\\"
      } else if (targetDir.includes(":")) {
        newCwd = targetDir.endsWith("\\") ? targetDir : targetDir + "\\"
      } else {
        newCwd = activeSession.cwd + (activeSession.cwd.endsWith("\\") ? "" : "\\") + targetDir
      }

      if (mockWindowsFileSystem[newCwd as keyof typeof mockWindowsFileSystem]) {
        output = ""
      } else {
        output =
          activeSession.shell === "cmd"
            ? `The system cannot find the path specified.`
            : `Set-Location : Cannot find path '${targetDir}' because it does not exist.`
        exitCode = 1
        newCwd = activeSession.cwd
      }
    } else if (cmd.toLowerCase() === "exit") {
      output = "Session terminated"
    } else if (activeSession.shell === "cmd" && cmd.toLowerCase() === "cls") {
      output = ""
      // Clear terminal
      setSessions((prev) =>
        prev.map((session) =>
          session.id === activeSessionId
            ? {
                ...session,
                history: [
                  {
                    id: Date.now().toString(),
                    command: "",
                    output: "Terminal cleared",
                    timestamp: new Date(),
                    exitCode: 0,
                    type: "system",
                  },
                ],
              }
            : session,
        ),
      )
      setCurrentCommand("")
      return
    } else if (activeSession.shell === "powershell" && cmd === "Clear-Host") {
      output = ""
      setSessions((prev) =>
        prev.map((session) =>
          session.id === activeSessionId
            ? {
                ...session,
                history: [
                  {
                    id: Date.now().toString(),
                    command: "",
                    output: "Terminal cleared",
                    timestamp: new Date(),
                    exitCode: 0,
                    type: "system",
                  },
                ],
              }
            : session,
        ),
      )
      setCurrentCommand("")
      return
    } else if (commands[cmd] || commands[cmd.toLowerCase()]) {
      try {
        output = (commands[cmd] || commands[cmd.toLowerCase()])(args, activeSession.cwd)
      } catch (error) {
        output = `${cmd}: command error`
        exitCode = 1
      }
    } else {
      output =
        activeSession.shell === "cmd"
          ? `'${cmd}' is not recognized as an internal or external command, operable program or batch file.`
          : `${cmd} : The term '${cmd}' is not recognized as the name of a cmdlet, function, script file, or operable program.`
      exitCode = 1
    }

    const newEntry: WindowsEntry = {
      id: Date.now().toString(),
      command,
      output,
      timestamp: new Date(),
      exitCode,
      type: exitCode === 0 ? "command" : "error",
    }

    setSessions((prev) =>
      prev.map((session) =>
        session.id === activeSessionId
          ? {
              ...session,
              history: [...session.history, newEntry],
              cwd: newCwd,
            }
          : session,
      ),
    )

    setCurrentCommand("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      executeCommand()
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1
        setHistoryIndex(newIndex)
        setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex])
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex])
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setCurrentCommand("")
      }
    } else if (e.key === "Tab") {
      e.preventDefault()
      // Simple tab completion for directories
      const [cmd, ...args] = currentCommand.split(" ")
      if ((cmd.toLowerCase() === "cd" || cmd === "Set-Location") && args.length === 1) {
        const partial = args[0]
        const currentDir = mockWindowsFileSystem[activeSession.cwd as keyof typeof mockWindowsFileSystem] || []
        const matches = currentDir.filter((item) => item.toLowerCase().startsWith(partial.toLowerCase()))
        if (matches.length === 1) {
          setCurrentCommand(`${cmd} ${matches[0]}`)
        }
      }
    } else if (e.ctrlKey && e.key === "c") {
      e.preventDefault()
      setCurrentCommand("")
    }
  }

  const createNewSession = (shell: "cmd" | "powershell" = "cmd") => {
    const newSession: WindowsSession = {
      id: `session-${Date.now()}`,
      name: `${shell.toUpperCase()} ${sessions.length + 1}`,
      cwd: "C:\\Users\\s3v3n",
      history: [
        {
          id: Date.now().toString(),
          command: "",
          output:
            shell === "cmd"
              ? "Microsoft Windows [Version 10.0.19045.3570]\n(c) Microsoft Corporation. All rights reserved.\n\nNew CMD session started"
              : "Windows PowerShell\nCopyright (C) Microsoft Corporation. All rights reserved.\n\nNew PowerShell session started",
          timestamp: new Date(),
          exitCode: 0,
          type: "system",
        },
      ],
      isActive: false,
      shell,
      environment: {
        USERNAME: "s3v3n",
        USERPROFILE: "C:\\Users\\s3v3n",
        PATH: "C:\\Windows\\System32;C:\\Windows;C:\\Program Files",
        COMPUTERNAME: "COMMANDHUB-PC",
      },
    }

    setSessions((prev) => [...prev, newSession])
    setActiveSessionId(newSession.id)
  }

  const closeSession = (sessionId: string) => {
    if (sessions.length === 1) return

    setSessions((prev) => prev.filter((s) => s.id !== sessionId))

    if (sessionId === activeSessionId) {
      const remainingSessions = sessions.filter((s) => s.id !== sessionId)
      setActiveSessionId(remainingSessions[0].id)
    }
  }

  const getPrompt = () => {
    if (activeSession.shell === "cmd") {
      return `${activeSession.cwd}>`
    } else {
      return `PS ${activeSession.cwd}>`
    }
  }

  return (
    <div className={`${isMaximized ? "fixed inset-0 z-50 bg-black" : ""}`}>
      <TechPanel
        title="WINDOWS TERMINAL"
        subtitle="CMD/POWERSHELL EMULATION"
        cornerAccent={true}
        borderAccent={true}
        className={isMaximized ? "h-full" : ""}
      >
        <div className="space-y-4">
          {/* Session Tabs */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`flex items-center space-x-2 px-3 py-1 rounded-sm cursor-pointer transition-all duration-200 ${
                    session.id === activeSessionId
                      ? "bg-dark-600/20 text-dark-700 border border-dark-500/40"
                      : "text-dark-500 hover:text-dark-600 hover:bg-dark-500/10"
                  }`}
                  onClick={() => setActiveSessionId(session.id)}
                >
                  <Terminal size={12} />
                  <span className="font-mono text-xs">{session.name}</span>
                  {sessions.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        closeSession(session.id)
                      }}
                      className="hover:text-red-400"
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
              ))}
              <div className="flex space-x-1">
                <TechButton
                  size="sm"
                  onClick={() => createNewSession("cmd")}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs"
                >
                  +CMD
                </TechButton>
                <TechButton
                  size="sm"
                  onClick={() => createNewSession("powershell")}
                  className="bg-blue-800 hover:bg-blue-700 text-white font-mono text-xs"
                >
                  +PS
                </TechButton>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="border-dark-400/50 text-dark-600 font-mono text-xs">
                {activeSession.shell.toUpperCase()}
              </Badge>
              <TechButton
                size="sm"
                variant="outline"
                onClick={() => setIsMaximized(!isMaximized)}
                className="border-dark-400/50 text-dark-600 hover:bg-dark-200/10 font-mono text-xs"
              >
                {isMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              </TechButton>
            </div>
          </div>

          {/* Terminal Output */}
          <div
            ref={terminalRef}
            className={`bg-black border border-dark-400/50 rounded font-mono text-sm overflow-auto ${
              isMaximized ? "h-[calc(100vh-200px)]" : "h-96"
            }`}
          >
            <ScrollArea className="h-full p-4">
              <div className="space-y-1">
                {activeSession.history.map((entry) => (
                  <div key={entry.id}>
                    {entry.command && (
                      <div className="flex items-start space-x-2">
                        <span className="text-white shrink-0">{getPrompt()}</span>
                        <span className="text-yellow-300">{entry.command}</span>
                      </div>
                    )}
                    {entry.output && (
                      <div
                        className={`whitespace-pre-wrap ${
                          entry.type === "error"
                            ? "text-red-400"
                            : entry.type === "system"
                              ? "text-cyan-400"
                              : "text-white"
                        }`}
                      >
                        {entry.output}
                      </div>
                    )}
                  </div>
                ))}

                {/* Current Input Line */}
                <div className="flex items-center space-x-2">
                  <span className="text-white shrink-0">{getPrompt()}</span>
                  <Input
                    ref={inputRef}
                    value={currentCommand}
                    onChange={(e) => setCurrentCommand(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent border-none text-yellow-300 font-mono text-sm p-0 focus:ring-0 focus:outline-none"
                    placeholder=""
                    autoComplete="off"
                  />
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-between text-xs font-mono text-dark-500 pt-2 border-t border-dark-400/30">
            <div className="flex items-center space-x-4">
              <span>Path: {activeSession.cwd}</span>
              <span>Shell: {activeSession.shell}</span>
              <span>History: {commandHistory.length}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Ctrl+C: Cancel</span>
              <span>Tab: Complete</span>
              <span>↑↓: History</span>
            </div>
          </div>
        </div>
      </TechPanel>
    </div>
  )
}
