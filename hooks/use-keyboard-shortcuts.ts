'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type ShortcutHandler = () => void

interface Shortcut {
  key: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  alt?: boolean
  handler: ShortcutHandler
  description: string
}

const globalShortcuts: Shortcut[] = [
  { key: 'd', ctrl: true, handler: () => {}, description: 'Go to Dashboard' },
  { key: 'c', ctrl: true, shift: true, handler: () => {}, description: 'Go to Command Hub' },
  { key: 'p', ctrl: true, shift: true, handler: () => {}, description: 'Go to Phone Suite' },
  { key: 't', ctrl: true, shift: true, handler: () => {}, description: 'Go to Terminal' },
  { key: 'o', ctrl: true, shift: true, handler: () => {}, description: 'Go to OSINT' },
  { key: '/', ctrl: true, handler: () => {}, description: 'Focus Search' },
  { key: 'Escape', handler: () => {}, description: 'Close Modal' },
]

export function useKeyboardShortcuts(customShortcuts?: Shortcut[]) {
  const router = useRouter()

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const shortcuts = [...globalShortcuts, ...(customShortcuts || [])]
    
    for (const shortcut of shortcuts) {
      const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : true
      const metaMatch = shortcut.meta ? event.metaKey : true
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey || shortcut.shift === undefined
      const altMatch = shortcut.alt ? event.altKey : !event.altKey
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()

      if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
        // Don't trigger if user is typing in an input
        const target = event.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return
        }

        event.preventDefault()
        
        // Handle navigation shortcuts
        if (shortcut.key === 'd' && shortcut.ctrl) {
          router.push('/')
        } else if (shortcut.key === 'c' && shortcut.ctrl && shortcut.shift) {
          router.push('/command-hub')
        } else if (shortcut.key === 'p' && shortcut.ctrl && shortcut.shift) {
          router.push('/phone-suite')
        } else if (shortcut.key === 't' && shortcut.ctrl && shortcut.shift) {
          router.push('/linux-terminal')
        } else if (shortcut.key === 'o' && shortcut.ctrl && shortcut.shift) {
          router.push('/intelligence/osint')
        } else {
          shortcut.handler()
        }
        
        return
      }
    }
  }, [router, customShortcuts])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

export function useShortcut(
  key: string, 
  handler: ShortcutHandler, 
  options?: { ctrl?: boolean; meta?: boolean; shift?: boolean; alt?: boolean }
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const ctrlMatch = options?.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey
      const shiftMatch = options?.shift ? event.shiftKey : !event.shiftKey
      const altMatch = options?.alt ? event.altKey : !event.altKey
      const keyMatch = event.key.toLowerCase() === key.toLowerCase()

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        const target = event.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return
        }
        
        event.preventDefault()
        handler()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [key, handler, options])
}

export const shortcutsList = [
  { keys: ['Cmd', 'K'], description: 'Open Command Palette' },
  { keys: ['Cmd', 'B'], description: 'Toggle Sidebar' },
  { keys: ['Ctrl', 'D'], description: 'Go to Dashboard' },
  { keys: ['Ctrl', 'Shift', 'C'], description: 'Go to Command Hub' },
  { keys: ['Ctrl', 'Shift', 'P'], description: 'Go to Phone Suite' },
  { keys: ['Ctrl', 'Shift', 'T'], description: 'Go to Terminal' },
  { keys: ['Ctrl', 'Shift', 'O'], description: 'Go to OSINT' },
  { keys: ['Esc'], description: 'Close Modal / Cancel' },
]
