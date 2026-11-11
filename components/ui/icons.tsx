import type React from "react"

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number
}

export function SecurityIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M12 2L3 7V12C3 16.97 7.02 21.5 12 22C16.98 21.5 21 16.97 21 12V7L12 2ZM12 20C8.13 19.57 5 15.78 5 12V8.35L12 4.5L19 8.35V12C19 15.78 15.87 19.57 12 20Z"
        fill="currentColor"
      />
      <path
        d="M12 12C10.9 12 10 11.1 10 10C10 8.9 10.9 8 12 8C13.1 8 14 8.9 14 10C14 11.1 13.1 12 12 12ZM12 14C14.21 14 16 15.79 16 18H8C8 15.79 9.79 14 12 14Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function NetworkIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M15 20C15 19.45 14.55 19 14 19H13V17H17C18.1 17 19 16.1 19 15V5C19 3.9 18.1 3 17 3H7C5.9 3 5 3.9 5 5V15C5 16.1 5.9 17 7 17H11V19H10C9.45 19 9 19.45 9 20H2V22H9C9 22.55 9.45 23 10 23H14C14.55 23 15 22.55 15 22H22V20H15ZM7 15V5H17V15H7Z"
        fill="currentColor"
      />
      <path
        d="M12 14C13.66 14 15 12.66 15 11C15 9.34 13.66 8 12 8C10.34 8 9 9.34 9 11C9 12.66 10.34 14 12 14ZM12 10C12.55 10 13 10.45 13 11C13 11.55 12.55 12 12 12C11.45 12 11 11.55 11 11C11 10.45 11.45 10 12 10Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function ThreatIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12 5.99L19.53 19H4.47L12 5.99ZM12 2L1 21H23L12 2Z" fill="currentColor" />
      <path d="M13 16H11V18H13V16Z" fill="currentColor" />
      <path d="M13 10H11V15H13V10Z" fill="currentColor" />
    </svg>
  )
}

export function IntelligenceIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M15.9 18.45C17.25 17.5 18.31 16.18 18.93 14.63C19.55 13.08 19.69 11.37 19.35 9.75C18.35 5.5 14.5 2.5 10.15 2.95C6.8 3.25 3.9 5.8 2.9 9.3C1.9 12.8 3.3 16.65 6.4 18.75C6.6 18.85 6.75 19.05 6.75 19.3L6.6 20.5C6.55 21.05 7 21.5 7.5 21.5H10.25V20.25C10.25 19.85 10.6 19.5 11 19.5C11.4 19.5 11.75 19.85 11.75 20.25V21.5H14.5C15.05 21.5 15.5 21.05 15.45 20.5L15.3 19.3C15.25 19 15.5 18.65 15.9 18.45ZM9 15.5C8.45 15.5 8 15.05 8 14.5C8 13.95 8.45 13.5 9 13.5C9.55 13.5 10 13.95 10 14.5C10 15.05 9.55 15.5 9 15.5ZM11.25 10.5C10.8 10.5 10.5 10.2 10.5 9.75V6.5C10.5 6.05 10.8 5.75 11.25 5.75C11.7 5.75 12 6.05 12 6.5V9.75C12 10.2 11.7 10.5 11.25 10.5ZM15 15.5C14.45 15.5 14 15.05 14 14.5C14 13.95 14.45 13.5 15 13.5C15.55 13.5 16 13.95 16 14.5C16 15.05 15.55 15.5 15 15.5Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function OperationsIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M19.43 12.98C19.47 12.66 19.5 12.34 19.5 12C19.5 11.66 19.47 11.34 19.43 11.02L21.54 9.37C21.73 9.22 21.78 8.95 21.66 8.73L19.66 5.27C19.54 5.05 19.27 4.97 19.05 5.05L16.56 6.05C16.04 5.65 15.48 5.32 14.87 5.07L14.49 2.42C14.46 2.18 14.25 2 14 2H10C9.75 2 9.54 2.18 9.51 2.42L9.13 5.07C8.52 5.32 7.96 5.66 7.44 6.05L4.95 5.05C4.72 4.96 4.46 5.05 4.34 5.27L2.34 8.73C2.21 8.95 2.27 9.22 2.46 9.37L4.57 11.02C4.53 11.34 4.5 11.67 4.5 12C4.5 12.33 4.53 12.66 4.57 12.98L2.46 14.63C2.27 14.78 2.22 15.05 2.34 15.27L4.34 18.73C4.46 18.95 4.73 19.03 4.95 18.95L7.44 17.95C7.96 18.35 8.52 18.68 9.13 18.93L9.51 21.58C9.54 21.82 9.75 22 10 22H14C14.25 22 14.46 21.82 14.49 21.58L14.87 18.93C15.48 18.68 16.04 18.34 16.56 17.95L19.05 18.95C19.28 19.04 19.54 18.95 19.66 18.73L21.66 15.27C21.78 15.05 21.73 14.78 21.54 14.63L19.43 12.98ZM12 15.5C10.07 15.5 8.5 13.93 8.5 12C8.5 10.07 10.07 8.5 12 8.5C13.93 8.5 15.5 10.07 15.5 12C15.5 13.93 13.93 15.5 12 15.5Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function ReportsIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM9 17H7V10H9V17ZM13 17H11V7H13V17ZM17 17H15V13H17V17Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function SettingsIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M19.14 12.94C19.18 12.64 19.2 12.33 19.2 12C19.2 11.68 19.18 11.36 19.13 11.06L21.16 9.48C21.34 9.34 21.39 9.07 21.28 8.87L19.36 5.55C19.24 5.33 18.99 5.26 18.77 5.33L16.38 6.29C15.88 5.91 15.35 5.59 14.76 5.35L14.4 2.81C14.36 2.57 14.16 2.4 13.92 2.4H10.08C9.84 2.4 9.65 2.57 9.61 2.81L9.25 5.35C8.66 5.59 8.12 5.92 7.63 6.29L5.24 5.33C5.02 5.25 4.77 5.33 4.65 5.55L2.74 8.87C2.62 9.08 2.66 9.34 2.86 9.48L4.89 11.06C4.84 11.36 4.8 11.69 4.8 12C4.8 12.31 4.82 12.64 4.87 12.94L2.84 14.52C2.66 14.66 2.61 14.93 2.72 15.13L4.64 18.45C4.76 18.67 5.01 18.74 5.23 18.67L7.62 17.71C8.12 18.09 8.65 18.41 9.24 18.65L9.6 21.19C9.65 21.43 9.84 21.6 10.08 21.6H13.92C14.16 21.6 14.36 21.43 14.39 21.19L14.75 18.65C15.34 18.41 15.88 18.09 16.37 17.71L18.76 18.67C18.98 18.75 19.23 18.67 19.35 18.45L21.27 15.13C21.39 14.91 21.34 14.66 21.15 14.52L19.14 12.94ZM12 15.6C10.02 15.6 8.4 13.98 8.4 12C8.4 10.02 10.02 8.4 12 8.4C13.98 8.4 15.6 10.02 15.6 12C15.6 13.98 13.98 15.6 12 15.6Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function DashboardIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 9H21V3H13V9Z" fill="currentColor" />
    </svg>
  )
}

export function LogoutIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M17 7L15.59 8.41L18.17 11H8V13H18.17L15.59 15.58L17 17L22 12L17 7ZM4 5H12V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H12V19H4V5Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function AlertIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function ShieldIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 11.99H19C18.47 16.11 15.72 19.78 12 20.93V12H5V6.3L12 3.19V11.99Z"
        fill="currentColor"
      />
    </svg>
  )
}

// --- Frame/SignalFrame icons (were imported but never defined → runtime crash on /signalframe) ---
import {
  Copy as LucideCopy,
  GitFork as LucideFork,
  VolumeX as LucideMute,
  Eye as LucideReveal,
  Send as LucideSend,
  ChevronRight as LucideChevronRight,
  Pencil as LucideEdit,
  X as LucideClose,
} from "lucide-react"

type LucideLikeProps = { size?: number; className?: string }
export const MirrorIcon = ({ size = 16, className }: LucideLikeProps) => <LucideCopy size={size} className={className} />
export const ForkIcon = ({ size = 16, className }: LucideLikeProps) => <LucideFork size={size} className={className} />
export const MuteIcon = ({ size = 16, className }: LucideLikeProps) => <LucideMute size={size} className={className} />
export const RevealIcon = ({ size = 16, className }: LucideLikeProps) => <LucideReveal size={size} className={className} />
export const SendIcon = ({ size = 16, className }: LucideLikeProps) => <LucideSend size={size} className={className} />
export const ChevronRightIcon = ({ size = 16, className }: LucideLikeProps) => (
  <LucideChevronRight size={size} className={className} />
)
export const EditIcon = ({ size = 16, className }: LucideLikeProps) => <LucideEdit size={size} className={className} />
export const CloseIcon = ({ size = 16, className }: LucideLikeProps) => <LucideClose size={size} className={className} />
