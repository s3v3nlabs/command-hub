"use client"

import { useRef, useState, type KeyboardEvent, type ClipboardEvent } from "react"
import { cn } from "@/lib/utils"

interface TokenInputProps {
  length?: number
  onComplete?: (token: string) => void
  className?: string
  disabled?: boolean
}

export function TokenInput({
  length = 8,
  onComplete,
  className,
  disabled = false,
}: TokenInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(""))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const focusInput = (index: number) => {
    if (index >= 0 && index < length) inputRefs.current[index]?.focus()
  }

  const handleChange = (index: number, value: string) => {
    if (disabled) return
    const newValue = value.toUpperCase().replace(/[^A-Z0-9]/g, "")
    if (newValue.length <= 1) {
      const newValues = [...values]
      newValues[index] = newValue
      setValues(newValues)
      if (newValue && index < length - 1) focusInput(index + 1)
      const token = newValues.join("")
      if (token.length === length && !newValues.includes("")) onComplete?.(token)
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return
    if (e.key === "Backspace") {
      if (!values[index] && index > 0) focusInput(index - 1)
      else {
        const newValues = [...values]
        newValues[index] = ""
        setValues(newValues)
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault()
      focusInput(index - 1)
    } else if (e.key === "ArrowRight") {
      e.preventDefault()
      focusInput(index + 1)
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return
    e.preventDefault()
    const pastedData = e.clipboardData
      .getData("text")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, length)
    const newValues = [...values]
    for (let i = 0; i < pastedData.length; i++) newValues[i] = pastedData[i]!
    setValues(newValues)
    if (pastedData.length === length) onComplete?.(pastedData)
    else focusInput(pastedData.length)
  }

  return (
    <div className={cn("flex gap-2 flex-wrap justify-center", className)}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el
          }}
          type="text"
          maxLength={1}
          value={values[index]}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={cn(
            "w-10 h-12 md:w-12 md:h-14 text-center text-lg md:text-xl font-mono rounded-none",
            "bg-black border border-white/30",
            "focus:border-white focus:outline-none",
            "text-white placeholder:text-white/20",
            "transition-colors duration-100",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "uppercase tracking-widest",
          )}
          autoComplete="off"
          aria-label={`Token character ${index + 1}`}
        />
      ))}
    </div>
  )
}
