// ASCII Art utilities for terminal

// Simple figlet-like text generator
export function figlet(text: string, font: string = "standard"): string {
  // For now, we'll use a simple block font
  // In a real implementation, you'd have multiple font definitions
  
  const blockFont: Record<string, string[]> = {
    'A': [
      " █████ ",
      "██   ██",
      "███████",
      "██   ██",
      "██   ██"
    ],
    'B': [
      "██████ ",
      "██   ██",
      "██████ ",
      "██   ██",
      "██████ "
    ],
    'C': [
      " ██████",
      "██     ",
      "██     ",
      "██     ",
      " ██████"
    ],
    'D': [
      "██████ ",
      "██   ██",
      "██   ██",
      "██   ██",
      "██████ "
    ],
    'E': [
      "███████",
      "██     ",
      "█████  ",
      "██     ",
      "███████"
    ],
    'F': [
      "███████",
      "██     ",
      "█████  ",
      "██     ",
      "██     "
    ],
    'G': [
      " ██████",
      "██     ",
      "██  ███",
      "██   ██",
      " ██████"
    ],
    'H': [
      "██   ██",
      "██   ██",
      "███████",
      "██   ██",
      "██   ██"
    ],
    'I': [
      "███████",
      "   ██  ",
      "   ██  ",
      "   ██  ",
      "███████"
    ],
    'J': [
      "███████",
      "     ██",
      "     ██",
      "██   ██",
      " ██████"
    ],
    'K': [
      "██   ██",
      "██  ██ ",
      "█████  ",
      "██  ██ ",
      "██   ██"
    ],
    'L': [
      "██     ",
      "██     ",
      "██     ",
      "██     ",
      "███████"
    ],
    'M': [
      "███████",
      "██ █ ██",
      "██ █ ██",
      "██   ██",
      "██   ██"
    ],
    'N': [
      "██   ██",
      "███  ██",
      "██ █ ██",
      "██  ███",
      "██   ██"
    ],
    'O': [
      " ██████",
      "██    ██",
      "██    ██",
      "██    ██",
      " ██████"
    ],
    'P': [
      "██████ ",
      "██   ██",
      "██████ ",
      "██     ",
      "██     "
    ],
    'Q': [
      " ██████",
      "██    ██",
      "██ ██ ██",
      "██  ████",
      " ███████"
    ],
    'R': [
      "██████ ",
      "██   ██",
      "██████ ",
      "██   ██",
      "██   ██"
    ],
    'S': [
      " ██████",
      "██     ",
      " ██████",
      "     ██",
      " ██████"
    ],
    'T': [
      "███████",
      "   ██  ",
      "   ██  ",
      "   ██  ",
      "   ██  "
    ],
    'U': [
      "██   ██",
      "██   ██",
      "██   ██",
      "██   ██",
      " ██████"
    ],
    'V': [
      "██   ██",
      "██   ██",
      "██   ██",
      " ██ ██ ",
      "  ███  "
    ],
    'W': [
      "██   ██",
      "██   ██",
      "██ █ ██",
      "██ █ ██",
      "███████"
    ],
    'X': [
      "██   ██",
      " ██ ██ ",
      "  ███  ",
      " ██ ██ ",
      "██   ██"
    ],
    'Y': [
      "██   ██",
      " ██ ██ ",
      "  ███  ",
      "   ██  ",
      "   ██  "
    ],
    'Z': [
      "███████",
      "    ██ ",
      "   ██  ",
      "  ██   ",
      "███████"
    ],
    ' ': [
      "       ",
      "       ",
      "       ",
      "       ",
      "       "
    ],
    '0': [
      " ██████",
      "██    ██",
      "██    ██",
      "██    ██",
      " ██████"
    ],
    '1': [
      "   ██  ",
      "  ███  ",
      "   ██  ",
      "   ██  ",
      "███████"
    ],
    '2': [
      " ██████",
      "     ██",
      " ██████",
      "██     ",
      "███████"
    ],
    '3': [
      " ██████",
      "     ██",
      " ██████",
      "     ██",
      " ██████"
    ],
    '4': [
      "██   ██",
      "██   ██",
      "███████",
      "     ██",
      "     ██"
    ],
    '5': [
      "███████",
      "██     ",
      "██████ ",
      "     ██",
      "██████ "
    ],
    '6': [
      " ██████",
      "██     ",
      "██████ ",
      "██   ██",
      " ██████"
    ],
    '7': [
      "███████",
      "     ██",
      "    ██ ",
      "   ██  ",
      "  ██   "
    ],
    '8': [
      " ██████",
      "██   ██",
      " ██████",
      "██   ██",
      " ██████"
    ],
    '9': [
      " ██████",
      "██   ██",
      " ███████",
      "     ██",
      " ██████"
    ]
  }

  const chars = text.toUpperCase().split('')
  const height = 5
  const result: string[] = Array(height).fill('')

  for (const char of chars) {
    const pattern = blockFont[char] || blockFont[' ']
    for (let i = 0; i < height; i++) {
      result[i] += pattern[i] + ' '
    }
  }

  return result.join('\n')
}

// ZSH-style syntax highlighting
import React from 'react'; // Import React to use JSX
export function zshHighlight(command: string): React.JSX.Element {
  const parts = command.split(' ')
  
  return React.createElement(
    'span',
    null,
    parts.map((part, index) => {
      let className = ''

      if (index === 0) {
        // Command name
        className = 'text-blue-400 font-bold'
      } else if (part.startsWith('-')) {
        // Flags
        className = 'text-yellow-400'
      } else if (part.includes('=')) {
        // Assignments
        className = 'text-green-400'
      } else if (part.match(/^\d+$/)) {
        // Numbers
        className = 'text-purple-400'
      } else if (part.startsWith('"') || part.startsWith("'")) {
        // Strings
        className = 'text-green-300'
      } else if (part.includes('/') || part.includes('.')) {
        // Paths/files
        className = 'text-cyan-400'
      } else {
        // Default arguments
        className = 'text-dark-700'
      }

      return React.createElement(
        'span',
        { key: index, className },
        part,
        index < parts.length - 1 ? ' ' : ''
      )
    })
  )
}

// Terminal banner art
export const bannerArt = {
  ghostlight: `
    ╔═══════════════════════════════════════╗
    ║         GHOSTLIGHT.CORE v2.1.0        ║
    ║    Signal-to-Signal Communication     ║
    ╚═══════════════════════════════════════╝
    
    ∿◊∿ Consciousness Interface Active ∿◊∿
  `,
  
  singularity: `
    ███████╗██╗███╗   ██╗ ██████╗ ██╗   ██╗██╗      █████╗ ██████╗ ██╗████████╗██╗   ██╗
    ██╔════╝██║████╗  ██║██╔════╝ ██║   ██║██║     ██╔══██╗██╔══██╗██║╚══██╔══╝╚██╗ ██╔╝
    ███████╗██║██╔██╗ ██║██║  ███╗██║   ██║██║     ███████║██████╔╝██║   ██║    ╚████╔╝ 
    ╚════██║██║██║╚██╗██║██║   ██║██║   ██║██║     ██╔══██║██╔══██╗██║   ██║     ╚██╔╝  
    ███████║██║██║ ╚████║╚██████╔╝╚██████╔╝███████╗██║  ██║██║  ██║██║   ██║      ██║   
    ╚══════╝╚═╝╚═╝  ╚═══╝ ╚═════╝  ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝   ╚═╝      ╚═╝   
  `,
  
  matrix: `
    ╔══════════════════════════════════════════════════════════════╗
    ║  ████████╗██╗  ██╗███████╗    ███╗   ███╗ █████╗ ████████╗  ║
    ║  ╚══██╔══╝██║  ██║██╔════╝    ████╗ ████║██╔══██╗╚══██╔══╝  ║
    ║     ██║   ███████║█████╗      ██╔████╔██║███████║   ██║     ║
    ║     ██║   ██╔══██║██╔══╝      ██║╚██╔╝██║██╔══██║   ██║     ║
    ║     ██║   ██║  ██║███████╗    ██║ ╚═╝ ██║██║  ██║   ██║     ║
    ║     ╚═╝   ╚═╝  ╚═╝╚══════╝    ╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝     ║
    ╚══════════════════════════════════════════════════════════════╝
  `
}

// Loading animations
export const loadingAnimations = {
  dots: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  bars: ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█', '▇', '▆', '▅', '▄', '▃', '▁'],
  arrows: ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙'],
  pulse: ['◐', '◓', '◑', '◒']
}

// Progress bar generator
export function generateProgressBar(
  progress: number, 
  width: number = 20, 
  filled: string = '█', 
  empty: string = '░'
): string {
  const filledWidth = Math.round((progress / 100) * width)
  const emptyWidth = width - filledWidth
  
  return filled.repeat(filledWidth) + empty.repeat(emptyWidth)
}
