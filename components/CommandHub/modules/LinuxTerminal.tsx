"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { TechPanel } from "@/components/ui/tech-panel"
import { TechButton } from "@/components/ui/tech-button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Terminal, Plus, X, Maximize2, Minimize2 } from "lucide-react"

interface TerminalSession {
  id: string
  name: string
  cwd: string
  history: TerminalEntry[]
  isActive: boolean
  shell: "bash" | "zsh"
  environment: Record<string, string>
}

interface TerminalEntry {
  id: string
  command: string
  output: string
  timestamp: Date
  exitCode: number
  type: "command" | "system" | "error"
}

const mockFileSystem = {
  "/": ["bin", "etc", "home", "usr", "var", "tmp", "opt"],
  "/home": ["s3v3n", "user"],
  "/home/s3v3n": ["Documents", "Downloads", "Projects", ".bashrc", ".zshrc", ".ssh"],
  "/home/s3v3n/Projects": ["CommandHub", "scripts", "tools"],
  "/home/s3v3n/Documents": ["notes.md", "research.txt", "passwords.gpg"],
  "/usr": ["bin", "lib", "share", "local"],
  "/usr/bin": ["python3", "curl", "wget", "git", "vim", "nano", "adb"],
}

const commandResponses: Record<string, (args: string[], cwd: string) => string> = {
  ls: (args, cwd) => {
    const path = args[0] || cwd
    const contents = mockFileSystem[path as keyof typeof mockFileSystem] || []
    return contents.join("  ")
  },
  pwd: (args, cwd) => cwd,
  whoami: () => "s3v3n",
  date: () => new Date().toString(),
  uname: (args) => {
    if (args.includes("-a"))
      return "Linux commandhub 6.5.0-kali3-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.5.6-1kali1 (2023-10-09) x86_64 GNU/Linux"
    return "Linux"
  },
  echo: (args) => args.join(" "),
  cat: (args) => {
    const file = args[0]
    if (file === ".bashrc") return "# ~/.bashrc\nexport PATH=$PATH:/usr/local/bin\nalias ll='ls -la'"
    if (file === ".zshrc") return "# ~/.zshrc\nexport ZSH_THEME='agnoster'\nplugins=(git docker kubectl)"
    return `cat: ${file}: No such file or directory`
  },
  ps: () => "  PID TTY          TIME CMD\n 1234 pts/0    00:00:01 bash\n 5678 pts/0    00:00:00 ps",
  df: () =>
    "Filesystem     1K-blocks    Used Available Use% Mounted on\n/dev/sda1       20971520 8388608  12582912  40% /",
  free: () =>
    "              total        used        free      shared  buff/cache   available\nMem:        8192000     2048000     4096000      102400     2048000     5939200",
  uptime: () => "14:32:18 up 2 days, 14:32, 1 user, load average: 0.15, 0.12, 0.08",
  id: () => "uid=1000(s3v3n) gid=1000(s3v3n) groups=1000(s3v3n),27(sudo),999(docker)",
  history: () => "1  ls -la\n2  cd Projects\n3  git status\n4  python3 --version\n5  curl --version",
  python3: (args) => {
    if (args.includes("--version")) return "Python 3.11.6"
    if (args.includes("-c")) return "Python code executed"
    return 'Python 3.11.6 (main, Oct  8 2023, 05:06:43) [GCC 13.2.0] on linux\nType "help", "copyright", "credits" or "license" for more information.\n>>>'
  },
  curl: (args) => {
    if (args.includes("--version")) return "curl 8.4.0 (x86_64-pc-linux-gnu)"
    if (args[0]?.startsWith("http"))
      return `HTTP/1.1 200 OK\nContent-Type: text/html\n\n<html><body>Response from ${args[0]}</body></html>`
    return "curl: try 'curl --help' for more information"
  },
  git: (args) => {
    if (args[0] === "status")
      return "On branch main\nYour branch is up to date with 'origin/main'.\n\nnothing to commit, working tree clean"
    if (args[0] === "--version") return "git version 2.42.0"
    return "usage: git [--version] [--help] [-C <path>] [-c <name>=<value>]"
  },
  adb: (args) => {
    if (args[0] === "devices") return "List of devices attached\n1A2B3C4D5E6F\tdevice\n7G8H9I0J1K2L\tdevice"
    if (args[0] === "version") return "Android Debug Bridge version 1.0.41"
    return "Android Debug Bridge version 1.0.41\nUsage: adb [-d|-e|-s <serialNumber>] <command>"
  },
  vim: () => "VIM - Vi IMproved 9.0 (2022 Jun 28, compiled Oct 01 2023 10:00:00)",
  nano: () => "GNU nano, version 7.2",
  wget: (args) => {
    if (args.includes("--version")) return "GNU Wget 1.21.4 built on linux-gnu."
    return "wget: missing URL"
  },
  clear: () => "",
  help: () =>
    "Available commands: ls, pwd, whoami, date, uname, echo, cat, ps, df, free, uptime, id, history, python3, curl, git, adb, vim, nano, wget, clear, help",
}

export default function LinuxTerminal() {
  const [sessions, setSessions] = useState<TerminalSession[]>([
    {
      id: "session-1",
      name: "Terminal 1",
      cwd: "/home/s3v3n",
      history: [
        {
          id: "1",
          command: "",
          output: "Welcome to CommandHub Linux Terminal\nType 'help' for available commands",
          timestamp: new Date(),
          exitCode: 0,
          type: "system",
        },
      ],
      isActive: true,
      shell: "zsh",
      environment: {
        USER: "s3v3n",
        HOME: "/home/s3v3n",
        PATH: "/usr/local/bin:/usr/bin:/bin",
        SHELL: "/bin/zsh",
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

    // Add to command history
    setCommandHistory((prev) => [...prev, command])
    setHistoryIndex(-1)

    let output = ""
    let exitCode = 0
    let newCwd = activeSession.cwd

    // Handle built-in commands
    if (cmd === "cd") {
      const targetDir = args[0] || "/home/s3v3n"
      if (targetDir === "..") {
        const pathParts = activeSession.cwd.split("/").filter(Boolean)
        pathParts.pop()
        newCwd = "/" + pathParts.join("/")
        if (newCwd === "/") newCwd = "/"
      } else if (targetDir.startsWith("/")) {
        newCwd = targetDir
      } else {
        newCwd = activeSession.cwd === "/" ? `/${targetDir}` : `${activeSession.cwd}/${targetDir}`
      }

      // Validate directory exists
      if (mockFileSystem[newCwd as keyof typeof mockFileSystem]) {
        output = ""
      } else {
        output = `cd: ${targetDir}: No such file or directory`
        exitCode = 1
        newCwd = activeSession.cwd
      }
    } else if (cmd === "exit") {
      output = "Session terminated"
      // In a real implementation, this would close the session
    } else if (commandResponses[cmd]) {
      try {
        output = commandResponses[cmd](args, activeSession.cwd)
      } catch (error) {
        output = `${cmd}: command error`
        exitCode = 1
      }
    } else {
      output = `${cmd}: command not found`
      exitCode = 127
    }

    const newEntry: TerminalEntry = {
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
      if (cmd === "cd" && args.length === 1) {
        const partial = args[0]
        const currentDir = mockFileSystem[activeSession.cwd as keyof typeof mockFileSystem] || []
        const matches = currentDir.filter((item) => item.startsWith(partial))
        if (matches.length === 1) {
          setCurrentCommand(`cd ${matches[0]}`)
        }
      }
    } else if (e.ctrlKey && e.key === "c") {
      e.preventDefault()
      setCurrentCommand("")
    } else if (e.ctrlKey && e.key === "l") {
      e.preventDefault()
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
    }
  }

  const createNewSession = () => {
    const newSession: TerminalSession = {
      id: `session-${Date.now()}`,
      name: `Terminal ${sessions.length + 1}`,
      cwd: "/home/s3v3n",
      history: [
        {
          id: Date.now().toString(),
          command: "",
          output: "New terminal session started",
          timestamp: new Date(),
          exitCode: 0,
          type: "system",
        },
      ],
      isActive: false,
      shell: "zsh",
      environment: {
        USER: "s3v3n",
        HOME: "/home/s3v3n",
        PATH: "/usr/local/bin:/usr/bin:/bin",
        SHELL: "/bin/zsh",
      },
    }

    setSessions((prev) => [...prev, newSession])
    setActiveSessionId(newSession.id)
  }

  const closeSession = (sessionId: string) => {
    if (sessions.length === 1) return // Don't close the last session

    setSessions((prev) => prev.filter((s) => s.id !== sessionId))

    if (sessionId === activeSessionId) {
      const remainingSessions = sessions.filter((s) => s.id !== sessionId)
      setActiveSessionId(remainingSessions[0].id)
    }
  }

  const getPrompt = () => {
    const user = activeSession.environment.USER
    const hostname = "commandhub"
    const cwd = activeSession.cwd === `/home/${user}` ? "~" : activeSession.cwd
    const shell = activeSession.shell === "zsh" ? "❯" : "$"

    return `${user}@${hostname}:${cwd} ${shell}`
  }

  return (
    <div className={`${isMaximized ? "fixed inset-0 z-50 bg-black" : ""}`}>
      <TechPanel
        title="LINUX TERMINAL"
        subtitle="ZSH/BASH EMULATION"
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
              <TechButton
                size="sm"
                onClick={createNewSession}
                className="bg-dark-600 hover:bg-dark-500 text-black font-mono text-xs"
              >
                <Plus size={12} />
              </TechButton>
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
                        <span className="text-green-400 shrink-0">{getPrompt()}</span>
                        <span className="text-white">{entry.command}</span>
                      </div>
                    )}
                    {entry.output && (
                      <div
                        className={`whitespace-pre-wrap ${
                          entry.type === "error"
                            ? "text-red-400"
                            : entry.type === "system"
                              ? "text-blue-400"
                              : "text-gray-300"
                        }`}
                      >
                        {entry.output}
                      </div>
                    )}
                  </div>
                ))}

                {/* Current Input Line */}
                <div className="flex items-center space-x-2">
                  <span className="text-green-400 shrink-0">{getPrompt()}</span>
                  <Input
                    ref={inputRef}
                    value={currentCommand}
                    onChange={(e) => setCurrentCommand(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent border-none text-white font-mono text-sm p-0 focus:ring-0 focus:outline-none"
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
              <span>CWD: {activeSession.cwd}</span>
              <span>Shell: {activeSession.shell}</span>
              <span>History: {commandHistory.length}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Ctrl+C: Cancel</span>
              <span>Ctrl+L: Clear</span>
              <span>Tab: Complete</span>
            </div>
          </div>
        </div>
      </TechPanel>
    </div>
  )
}
