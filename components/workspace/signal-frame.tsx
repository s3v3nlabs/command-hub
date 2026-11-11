"use client"
import { FrameManager } from "./frame-manager"

export function SignalFrame() {
  return (
    <div className="w-full h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-40 p-4 bg-gray-900/50 border-b border-gray-700/30 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-100">SignalFrame</h1>
            <p className="text-sm text-gray-400">WhisperMesh • Multi-threaded Conversational Interface</p>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>Bridge Active</span>
            </div>
            <div className="text-xs font-mono">v1.0.0-whisper</div>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="pt-20 w-full h-full">
        <FrameManager />
      </main>

      {/* Footer Status */}
      <footer className="absolute bottom-0 left-0 right-0 z-40 p-2 bg-gray-900/30 border-t border-gray-700/20 backdrop-blur-sm">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>Relay: Standby</span>
            <span>Socket: Disconnected</span>
            <span>Memory: 0 contexts</span>
          </div>
          <div>Ready for backend injection</div>
        </div>
      </footer>
    </div>
  )
}
