/**
 * CMDHUB-04 // AUTONOMY LAYER
 * Type definitions for thread routing
 */

export interface RouteResult {
  destination: string
  action: string
  priority: "low" | "medium" | "high" | "critical"
  response?: any
  metadata?: Record<string, any>
}

export interface RouteHandler {
  handle: (action: string, metadata?: any) => Promise<any>
  canHandle: (action: string) => boolean
  getPriority: () => number
}

export interface RouteRegistry {
  [key: string]: RouteHandler
}

export interface RoutingStats {
  totalRouted: number
  successfulRoutes: number
  failedRoutes: number
  routesByDestination: Record<string, number>
  averageProcessingTime: number
}
