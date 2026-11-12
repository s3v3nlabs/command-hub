import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"

export default function SelfHealingPage() {
  return (
    <div className="hub-shell flex bg-black text-zinc-200">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Header title="SELF-HEALING" />
        <main className="p-6 max-w-2xl space-y-3 text-sm">
          <h1 className="text-xl font-semibold">Self-healing theater removed</h1>
          <p>
            The previous agent-core, vault, replay, and autonomy-governor panels on this page generated canned
            incidents and mock proposals. They never repaired a real system. Those modules have been deleted.
          </p>
          <p>
            Real defensive actions live in the lab tools: <code>/offsec/deception</code> (decoy/canary events),
            the authorization ladder on <code>/offsec/engagements</code>, and host signals on{" "}
            <code>/command-hub</code> and <code>/heimdal-terminal</code>.
          </p>
        </main>
      </div>
    </div>
  )
}
