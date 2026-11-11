"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lock, Send, User, Shield } from "lucide-react"
import { speak } from "@/lib/audio"

interface Message {
  id: string
  sender: string
  content: string
  timestamp: string
  encrypted: boolean
  read: boolean
}

export default function SecureMessages() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "Agent Corvus",
      content: "Package delivered to extraction point. Awaiting confirmation.",
      timestamp: "2023-05-12T14:32:00Z",
      encrypted: true,
      read: true,
    },
    {
      id: "2",
      sender: "Command",
      content: "Confirmation received. Proceed to secondary location.",
      timestamp: "2023-05-12T14:45:00Z",
      encrypted: true,
      read: true,
    },
    {
      id: "3",
      sender: "Agent Talon",
      content: "Surveillance detected at checkpoint alpha. Requesting alternate route.",
      timestamp: "2023-05-12T15:10:00Z",
      encrypted: true,
      read: false,
    },
    {
      id: "4",
      sender: "System",
      content: "ALERT: Security protocol breach detected. Initiating lockdown procedures.",
      timestamp: "2023-05-12T15:30:00Z",
      encrypted: false,
      read: false,
    },
  ])

  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [newMessage, setNewMessage] = useState("")

  const handleMessageSelect = (message: Message) => {
    setSelectedMessage(message)
    if (!message.read) {
      speak("Encrypted message opened")
      setMessages(messages.map((m) => (m.id === message.id ? { ...m, read: true } : m)))
    }
  }

  const sendMessage = () => {
    if (!newMessage.trim()) return

    const message: Message = {
      id: Date.now().toString(),
      sender: "You",
      content: newMessage,
      timestamp: new Date().toISOString(),
      encrypted: true,
      read: true,
    }

    setMessages([...messages, message])
    setNewMessage("")
    speak("Secure message sent")
  }

  return (
    <Card className="bg-dark-50 border-dark-300 shadow-lg h-full">
      <CardHeader className="border-b border-dark-300 bg-dark-100 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-green-500" />
          Secure Communications
        </CardTitle>
        <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-500">
          <Shield className="h-3 w-3 mr-1" /> E2E Encrypted
        </Badge>
      </CardHeader>
      <CardContent className="p-0 flex h-[500px]">
        <div className="w-1/3 border-r border-dark-300 overflow-y-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`p-3 border-b border-dark-300 cursor-pointer hover:bg-dark-100 transition-colors ${
                selectedMessage?.id === message.id ? "bg-dark-200" : ""
              } ${!message.read ? "bg-dark-300/30" : ""}`}
              onClick={() => handleMessageSelect(message)}
            >
              <div className="flex justify-between items-center mb-1">
                <div className="font-medium flex items-center">
                  <User className="h-3 w-3 mr-1" />
                  {message.sender}
                </div>
                <div className="text-xs text-gray-400">{new Date(message.timestamp).toLocaleTimeString()}</div>
              </div>
              <div className="text-sm truncate">
                {message.encrypted ? `${message.content.substring(0, 20)}...` : message.content.substring(0, 25)}
              </div>
              {!message.read && <Badge className="mt-1 bg-blue-900/20 text-blue-400 border-blue-500">New</Badge>}
            </div>
          ))}
        </div>
        <div className="w-2/3 flex flex-col">
          {selectedMessage ? (
            <>
              <div className="p-4 border-b border-dark-300 bg-dark-100">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">{selectedMessage.sender}</h3>
                  <span className="text-xs text-gray-400">{new Date(selectedMessage.timestamp).toLocaleString()}</span>
                </div>
                {selectedMessage.encrypted && (
                  <Badge className="mt-1 bg-green-900/20 text-green-400 border-green-500">
                    <Lock className="h-3 w-3 mr-1" /> Encrypted
                  </Badge>
                )}
              </div>
              <div className="p-4 flex-grow overflow-y-auto">
                <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">Select a message to view</div>
          )}
          <div className="p-3 border-t border-dark-300 mt-auto">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-grow bg-dark-200 border border-dark-300 rounded p-2 text-sm"
                placeholder="Type secure message..."
              />
              <button onClick={sendMessage} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
