"use client"

import { useState, useEffect } from "react"
import { TechPanel } from "@/components/ui/tech-panel"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { cn } from "@/lib/utils"
import { Clock, Play, Square, XCircle } from "lucide-react"
import { TechButton } from "@/components/ui/tech-button"

interface TaskQueueProps {
  className?: string
}

interface Task {
  id: string
  name: string
  status: "queued" | "running" | "completed" | "failed"
  progress: number
  startTime: Date
  endTime?: Date
  description: string
  type: "security" | "maintenance" | "analysis" | "backup"
}

// Sample tasks for demonstration
const INITIAL_TASKS: Task[] = [
  {
    id: "task-1",
    name: "Security Scan",
    status: "running",
    progress: 45,
    startTime: new Date(Date.now() - 1000 * 60 * 5), // Started 5 minutes ago
    description: "Comprehensive security scan of all network endpoints",
    type: "security",
  },
  {
    id: "task-2",
    name: "Database Backup",
    status: "queued",
    progress: 0,
    startTime: new Date(),
    description: "Full backup of primary and secondary databases",
    type: "backup",
  },
  {
    id: "task-3",
    name: "Log Analysis",
    status: "completed",
    progress: 100,
    startTime: new Date(Date.now() - 1000 * 60 * 30), // Started 30 minutes ago
    endTime: new Date(Date.now() - 1000 * 60 * 25), // Ended 25 minutes ago
    description: "Analysis of system logs for anomalous patterns",
    type: "analysis",
  },
  {
    id: "task-4",
    name: "System Update",
    status: "failed",
    progress: 67,
    startTime: new Date(Date.now() - 1000 * 60 * 45), // Started 45 minutes ago
    endTime: new Date(Date.now() - 1000 * 60 * 40), // Ended 40 minutes ago
    description: "Update of core system components to latest version",
    type: "maintenance",
  },
]

export function TaskQueue({ className }: TaskQueueProps) {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS)

  // Update running tasks progress
  useEffect(() => {
    const timer = setInterval(() => {
      setTasks((prevTasks) =>
        prevTasks.map((task) => {
          if (task.status === "running" && task.progress < 100) {
            const newProgress = Math.min(task.progress + Math.random() * 5, 100)

            // If task reaches 100%, mark as completed
            if (newProgress === 100) {
              return {
                ...task,
                status: "completed",
                progress: 100,
                endTime: new Date(),
              }
            }

            return {
              ...task,
              progress: newProgress,
            }
          }
          return task
        }),
      )
    }, 3000)

    return () => clearInterval(timer)
  }, [])

  // Add a new task occasionally
  useEffect(() => {
    const timer = setInterval(() => {
      // 20% chance to add a new task
      if (Math.random() > 0.8) {
        const taskTypes = ["security", "maintenance", "analysis", "backup"] as const
        const taskType = taskTypes[Math.floor(Math.random() * taskTypes.length)]

        const taskNames = {
          security: ["Vulnerability Scan", "Firewall Audit", "Intrusion Detection", "Access Control Review"],
          maintenance: ["Disk Cleanup", "Index Optimization", "Cache Refresh", "Resource Reallocation"],
          analysis: [
            "Performance Analysis",
            "Traffic Pattern Analysis",
            "User Behavior Analysis",
            "Resource Usage Analysis",
          ],
          backup: ["Incremental Backup", "Configuration Backup", "User Data Backup", "System Image Creation"],
        }

        const name = taskNames[taskType][Math.floor(Math.random() * taskNames[taskType].length)]

        const newTask: Task = {
          id: `task-${Date.now()}`,
          name,
          status: "queued",
          progress: 0,
          startTime: new Date(),
          description: `Automated ${taskType} task: ${name.toLowerCase()}`,
          type: taskType,
        }

        setTasks((prevTasks) => [...prevTasks, newTask])
      }

      // Start the first queued task if any
      setTasks((prevTasks) => {
        const queuedTaskIndex = prevTasks.findIndex((task) => task.status === "queued")
        if (queuedTaskIndex >= 0) {
          const updatedTasks = [...prevTasks]
          updatedTasks[queuedTaskIndex] = {
            ...updatedTasks[queuedTaskIndex],
            status: "running",
          }
          return updatedTasks
        }
        return prevTasks
      })
    }, 15000)

    return () => clearInterval(timer)
  }, [])

  const getTaskStatusBadge = (status: Task["status"]) => {
    switch (status) {
      case "queued":
        return <Badge variant="outline">QUEUED</Badge>
      case "running":
        return <Badge variant="default">RUNNING</Badge>
      case "completed":
        return <Badge variant="success">COMPLETED</Badge>
      case "failed":
        return <Badge variant="danger">FAILED</Badge>
    }
  }

  const getTaskIcon = (type: Task["type"]) => {
    switch (type) {
      case "security":
        return "🔒"
      case "maintenance":
        return "🔧"
      case "analysis":
        return "📊"
      case "backup":
        return "💾"
    }
  }

  return (
    <TechPanel
      variant="default"
      cornerAccent
      borderAccent
      title="TASK QUEUE"
      className={cn("flex flex-col", className)}
      actions={
        <div className="flex items-center space-x-2">
          <Badge variant="outline">{tasks.filter((t) => t.status === "running").length} RUNNING</Badge>
          <Badge variant="outline">{tasks.filter((t) => t.status === "queued").length} QUEUED</Badge>
        </div>
      }
    >
      <div className="flex-1 overflow-auto">
        <Accordion type="multiple" className="w-full">
          {tasks.map((task) => (
            <AccordionItem key={task.id} value={task.id} className="border-b border-dark-300/20">
              <AccordionTrigger className="py-2 hover:no-underline">
                <div className="flex items-center justify-between w-full pr-2">
                  <div className="flex items-center">
                    <span className="mr-2">{getTaskIcon(task.type)}</span>
                    <span className="font-mono text-sm">{task.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getTaskStatusBadge(task.status)}
                    {task.status === "running" && (
                      <span className="text-xs font-mono">{task.progress.toFixed(0)}%</span>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pl-6 pr-2 pb-2">
                  <p className="text-sm mb-2">{task.description}</p>

                  {task.status === "running" && <Progress value={task.progress} className="h-1 mb-2" />}

                  <div className="flex items-center justify-between text-xs text-dark-500">
                    <div className="flex items-center">
                      <Clock size={12} className="mr-1" />
                      Started: {task.startTime.toLocaleTimeString()}
                    </div>

                    {task.endTime && (
                      <div className="flex items-center">
                        <Clock size={12} className="mr-1" />
                        Ended: {task.endTime.toLocaleTimeString()}
                      </div>
                    )}

                    {task.status === "queued" && (
                      <div className="flex space-x-1">
                        <TechButton variant="outline" size="xs">
                          <Play size={10} className="mr-1" />
                          Start
                        </TechButton>
                        <TechButton variant="outline" size="xs">
                          <XCircle size={10} className="mr-1" />
                          Cancel
                        </TechButton>
                      </div>
                    )}

                    {task.status === "running" && (
                      <TechButton variant="outline" size="xs">
                        <Square size={10} className="mr-1" />
                        Stop
                      </TechButton>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </TechPanel>
  )
}
