"use client"
import * as React from "react"
import type { ToastActionElement, ToastProps } from "@/components/ui/toast"

const TOAST_LIMIT = 3
const TOAST_REMOVE_DELAY = 4000
type ToasterToast = ToastProps & { id: string; title?: React.ReactNode; description?: React.ReactNode; action?: ToastActionElement }

let count = 0
function genId() { count = (count + 1) % Number.MAX_SAFE_INTEGER; return count.toString() }

type State = { toasts: ToasterToast[] }
const listeners: Array<(state: State) => void> = []
let memoryState: State = { toasts: [] }

function dispatch(action: { type: "ADD_TOAST" | "UPDATE_TOAST" | "DISMISS_TOAST" | "REMOVE_TOAST"; toast?: Partial<ToasterToast>; toastId?: string }) {
  switch (action.type) {
    case "ADD_TOAST":
      memoryState = { toasts: [action.toast as ToasterToast, ...memoryState.toasts].slice(0, TOAST_LIMIT) }
      break
    case "UPDATE_TOAST":
      memoryState = { toasts: memoryState.toasts.map(t => t.id === action.toast?.id ? { ...t, ...action.toast } : t) }
      break
    case "DISMISS_TOAST":
      memoryState = { toasts: memoryState.toasts.map(t => (t.id === action.toastId || action.toastId === undefined) ? { ...t, open: false } : t) }
      break
    case "REMOVE_TOAST":
      memoryState = { toasts: action.toastId === undefined ? [] : memoryState.toasts.filter(t => t.id !== action.toastId) }
      break
  }
  listeners.forEach(l => l(memoryState))
}

function toast({ ...props }: Omit<ToasterToast, "id">) {
  const id = genId()
  const update = (p: ToasterToast) => dispatch({ type: "UPDATE_TOAST", toast: { ...p, id } })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })
  dispatch({ type: "ADD_TOAST", toast: { ...props, id, open: true, onOpenChange: (open: boolean) => { if (!open) dismiss() } } })
  setTimeout(() => dispatch({ type: "REMOVE_TOAST", toastId: id }), TOAST_REMOVE_DELAY)
  return { id, dismiss, update }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)
  React.useEffect(() => {
    listeners.push(setState)
    return () => { const i = listeners.indexOf(setState); if (i > -1) listeners.splice(i, 1) }
  }, [])
  return { ...state, toast, dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }) }
}

export { useToast, toast }
