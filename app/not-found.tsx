import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-black text-zinc-200">
      <h1 className="font-mono text-2xl tracking-widest">404</h1>
      <p className="text-sm text-zinc-400">Route not found in the Command Hub.</p>
      <Link href="/" className="text-sm text-sky-400 underline">
        Return home
      </Link>
    </div>
  )
}
