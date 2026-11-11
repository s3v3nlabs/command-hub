"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useTerminal } from "./terminal-context"
import { TechPanel } from "../ui/tech-panel"
import { TechButton } from "../ui/tech-button"
import { Badge } from "../ui/badge"
import { cn } from "@/lib/utils"
import { Users, Send, UserPlus, Shield, Clock } from "lucide-react"

export function TerminalCollaboration({ className }: { className?: string }) {
  const { collaborationActive, collaborationUsers, startCollaboration, stopCollaboration, sendCollaborationMessage } =
    useTerminal()
  const [message, setMessage] = useState("")
  const [chatMessages, setChatMessages] = useState<
    Array<{
      id: string
      userId: string
      userName: string
      content: string
      timestamp: number
    }>
  >([])
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [chatMessages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !collaborationActive) return

    // Add message to chat
    const newMessage = {
      id: `msg-${Date.now()}`,
      userId: "self",
      userName: "You",
      content: message,
      timestamp: Date.now(),
    }

    setChatMessages((prev) => [...prev, newMessage])
    sendCollaborationMessage(message)
    setMessage("")

    // Simulate response after a delay
    setTimeout(() => {
      const responses = [
        "Checking that now...",
        "Let me analyze the network traffic.",
        "I see the issue. Try running 'firewall status'.",
        "Have you checked the system logs?",
        "Let's try a different approach.",
      ]

      const responseUser = collaborationUsers[Math.floor(Math.random() * collaborationUsers.length)]

      if (responseUser) {
        const responseMessage = {
          id: `msg-${Date.now()}`,
          userId: responseUser.id,
          userName: responseUser.name,
          content: responses[Math.floor(Math.random() * responses.length)],
          timestamp: Date.now(),
        }

        setChatMessages((prev) => [...prev, responseMessage])
      }
    }, 2000)
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-dark-800"
      case "idle":
        return "bg-dark-500"
      default:
        return "bg-dark-300"
    }
  }

  const getTimeSince = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)

    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    return `${Math.floor(seconds / 3600)}h ago`
  }

  return (
    <TechPanel
      className={cn("flex flex-col", className)}
      variant="default"
      cornerAccent
      borderAccent
      title="TERMINAL COLLABORATION"
      actions={
        <div className="flex space-x-2">
          <Badge variant={collaborationActive ? "default" : "outline"}>
            {collaborationActive ? "ACTIVE" : "INACTIVE"}
          </Badge>
          <TechButton
            variant="outline"
            size="sm"
            onClick={collaborationActive ? stopCollaboration : startCollaboration}
          >
            {collaborationActive ? "DISCONNECT" : "CONNECT"}
          </TechButton>
        </div>
      }
    >
      {collaborationActive ? (
        <div className="flex flex-col h-full">
          <div className="flex border-b border-dark-300/30 p-2">
            <div className="flex-1">
              <div className="text-xs text-dark-600">Connected Users</div>
              <div className="flex mt-1 space-x-2">
                {collaborationUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center text-xs bg-dark-100/20 px-2 py-1 rounded-sm"
                    style={{ borderLeft: `2px solid ${user.color}` }}
                  >
                    <div className={cn("w-2 h-2 rounded-full mr-1", getStatusColor(user.status))} />
                    {user.name}
                    <Clock size={10} className="ml-1 text-dark-500" />
                    <span className="text-dark-500 text-[10px] ml-0.5">{getTimeSince(user.lastActivity)}</span>
                  </div>
                ))}
                <div className="flex items-center text-xs bg-dark-100/20 px-2 py-1 rounded-sm border-l-2 border-dark-800">
                  <div className="w-2 h-2 rounded-full mr-1 bg-dark-800" />
                  You
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <TechButton variant="outline" size="sm" className="text-xs">
                <UserPlus size={12} className="mr-1" />
                INVITE
              </TechButton>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-dark-500 text-sm">
                <Users size={24} className="mb-2" />
                <div>No messages yet</div>
                <div className="text-xs">Start the conversation by sending a message</div>
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex max-w-[80%] rounded-sm p-2",
                    msg.userId === "self"
                      ? "ml-auto bg-dark-100/20 border-r-2 border-dark-800"
                      : "bg-dark-100/10 border-l-2",
                  )}
                  style={
                    msg.userId !== "self"
                      ? {
                          borderColor: collaborationUsers.find((u) => u.id === msg.userId)?.color || "var(--dark-300)",
                        }
                      : undefined
                  }
                >
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <div className="text-xs font-bold">{msg.userName}</div>
                      <div className="text-[10px] text-dark-500">{formatTime(msg.timestamp)}</div>
                    </div>
                    <div className="text-sm">{msg.content}</div>
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="border-t border-dark-300/30 p-2 flex">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 bg-dark-100/30 border border-dark-300/30 rounded-sm px-2 py-1 text-sm"
              placeholder="Type a message..."
            />
            <TechButton type="submit" variant="outline" size="sm" className="ml-2">
              <Send size={14} className="mr-1" />
              SEND
            </TechButton>
          </form>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-dark-500">
          <Shield size={32} className="mb-2" />
          <div className="text-sm">Terminal collaboration is inactive</div>
          <div className="text-xs mb-4">Connect to start collaborating with other users</div>
          <TechButton variant="outline" size="sm" onClick={startCollaboration}>
            START COLLABORATION
          </TechButton>
        </div>
      )}
    </TechPanel>
  )
}
