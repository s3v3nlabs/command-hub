/**
 * CMDHUB-04 // AUTONOMY LAYER
 * Modular thread-based router for CMDHUB signals
 */

import type { RouteResult } from "./types/routing"

// Command priority levels
export enum Priority {
  LOW = 0,
  STANDARD = 1,
  HIGH = 2,
  CRITICAL = 3,
}

// Command interface
export interface Command {
  raw: string
  route: string //CommandRoute
  priority: Priority | string //Priority
  timestamp: number
}

/**
 * Routes incoming threads to appropriate handlers
 */
export function routeThread(input: string): RouteResult {
  // Parse the input for routing
  const normalizedInput = input.trim().toUpperCase()

  // Route based on prefixes
  if (normalizedInput.startsWith("GL/")) {
    return {
      destination: "ghostlight_bridge",
      action: normalizedInput.substring(3),
      priority: "high",
    }
  }

  if (normalizedInput.startsWith("RECON/")) {
    return {
      destination: "intel-forge",
      action: normalizedInput.substring(6),
      priority: "medium",
    }
  }

  if (normalizedInput.startsWith("SYS/")) {
    return {
      destination: "system-diagnostics",
      action: normalizedInput.substring(4),
      priority: "high",
    }
  }

  if (normalizedInput.startsWith("DRIFT/")) {
    return {
      destination: "drift-correction",
      action: normalizedInput.substring(6),
      priority: "critical",
    }
  }

  if (normalizedInput.startsWith("AUTH/")) {
    return {
      destination: "authorization",
      action: normalizedInput.substring(5),
      priority: "high",
    }
  }

  // Handle special commands
  if (normalizedInput === "PING") {
    return {
      destination: "system-diagnostics",
      action: "PING",
      priority: "low",
      response: "PONG",
    }
  }

  // Default unrouted response
  return {
    destination: "unrouted",
    action: normalizedInput,
    priority: "low",
  }
}

/**
 * Parse a command string into a structured Command object
 * @param input Raw command string
 * @returns Structured command object
 */
export function parseCommand(input: string): Command {
  const route = routeThread(input).destination

  // Determine priority based on content
  let priority: Priority | string = Priority.STANDARD
  if (input.includes("CRITICAL")) priority = Priority.CRITICAL
  else if (input.includes("URGENT")) priority = Priority.HIGH
  else if (input.includes("LOW")) priority = Priority.LOW
  else if (routeThread(input).priority) priority = routeThread(input).priority

  return {
    raw: input,
    route,
    priority,
    timestamp: Date.now(),
  }
}

/**
 * Queue for storing commands that need to be processed
 */
export class CommandQueue {
  private queue: Command[] = []

  /**
   * Add a command to the queue
   */
  enqueue(command: Command): void {
    // Insert based on priority (higher priority first)
    const insertIndex = this.queue.findIndex((cmd) => {
      const cmdPriority =
        typeof cmd.priority === "string" ? Priority[cmd.priority.toUpperCase() as keyof typeof Priority] : cmd.priority
      const commandPriority =
        typeof command.priority === "string"
          ? Priority[command.priority.toUpperCase() as keyof typeof Priority]
          : command.priority
      return cmdPriority < commandPriority
    })

    if (insertIndex === -1) {
      this.queue.push(command)
    } else {
      this.queue.splice(insertIndex, 0, command)
    }
  }

  /**
   * Get the next command from the queue
   */
  dequeue(): Command | undefined {
    return this.queue.shift()
  }

  /**
   * Check if the queue is empty
   */
  isEmpty(): boolean {
    return this.queue.length === 0
  }

  /**
   * Get the current size of the queue
   */
  size(): number {
    return this.queue.length
  }
}

// Create a global command queue instance
export const globalCommandQueue = new CommandQueue()

/**
 * Execute a routed command
 */
export async function executeRoute(route: RouteResult): Promise<any> {
  console.log(`🧵 Executing route: ${route.destination}/${route.action}`)

  // Handle immediate responses
  if (route.response) {
    return route.response
  }

  // TODO: Implement actual routing logic to different modules
  switch (route.destination) {
    case "ghostlight_bridge":
      // TODO: Forward to GhostLight bridge
      return { status: "forwarded_to_ghostlight" }

    case "intel-forge":
      // TODO: Forward to intelligence modules
      return { status: "forwarded_to_intel" }

    case "system-diagnostics":
      // TODO: Run system diagnostics
      return { status: "diagnostics_initiated" }

    case "drift-correction":
      // TODO: Handle drift correction
      return { status: "drift_correction_initiated" }

    case "authorization":
      // TODO: Handle authorization requests
      return { status: "auth_request_processed" }

    case "unrouted":
    default:
      return {
        status: "unrecognized_command",
        message: "Command not recognized. Use SYS/HELP for available commands.",
      }
  }
}

/**
 * Get available routes for help documentation
 */
export function getAvailableRoutes(): string[] {
  return [
    "GL/[command] - GhostLight Bridge commands",
    "RECON/[command] - Intelligence reconnaissance",
    "SYS/[command] - System diagnostics and control",
    "DRIFT/[command] - Drift detection and correction",
    "AUTH/[command] - Authorization and permissions",
    "PING - System heartbeat check",
  ]
}
