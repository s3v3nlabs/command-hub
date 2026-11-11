"use client"

import { useMemo, useState } from "react"
import { Search, Copy, Check, ExternalLink, ChevronRight, Folder, FileSearch, Globe, Users } from "lucide-react"
import { SuiteShell, SuiteNavLink } from "@/components/offsec/suite-shell"
import {
  GOOGLE_OPERATORS,
  DORK_RECIPES,
  OSINT_TREE,
  SEARCH_ENGINES,
  SECTF_REPORT_TEMPLATE,
  type OsintNode,
} from "@/lib/offsec/osint-data"

type Tab = "dork" | "operators" | "framework" | "lookups" | "se"

function useCopy() {
  const [k, setK] = useState<string | null>(null)
  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setK(key)
      setTimeout(() => setK(null), 1200)
    } catch {
      /* ignore */
    }
  }
  return { k, copy }
}

function TreeNode({ node, depth = 0 }: { node: OsintNode; depth?: number }) {
  const [open, setOpen] = useState(depth < 1)
  const hasKids = !!node.children?.length
  return (
    <div style={{ marginLeft: depth ? 12 : 0 }}>
      <div className="flex items-center gap-1.5 py-0.5">
        {hasKids ? (
          <button type="button" className="ghost-icon-btn h-5 w-5" onClick={() => setOpen((v) => !v)}>
            <ChevronRight size={12} className={`transition-transform ${open ? "rotate-90" : ""}`} />
          </button>
        ) : (
          <span className="inline-block w-5" />
        )}
        {hasKids ? <Folder size={12} className="text-[color:var(--ghost-faint)]" /> : <span className="text-[color:var(--ghost-faint)]">›</span>}
        {node.url ? (
          <a href={node.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-[12px] text-[color:var(--ghost-ink)] hover:underline">
            {node.name}
            <ExternalLink size={10} className="opacity-60" />
          </a>
        ) : (
          <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-[color:var(--ghost-ink)]">{node.name}</span>
        )}
        {node.note && <span className="text-[10px] text-[color:var(--ghost-faint)]">({node.note})</span>}
      </div>
      {open && node.children?.map((c) => <TreeNode key={c.name} node={c} depth={depth + 1} />)}
    </div>
  )
}

export default function OsintSuitePage() {
  const [tab, setTab] = useState<Tab>("dork")
  const { k, copy } = useCopy()

  // dork builder state
  const [domain, setDomain] = useState("")
  const [terms, setTerms] = useState("")
  const [filetype, setFiletype] = useState("")
  const [inurl, setInurl] = useState("")
  const [intitle, setIntitle] = useState("")
  const [exact, setExact] = useState("")
  const [exclude, setExclude] = useState("")

  const builtDork = useMemo(() => {
    const parts: string[] = []
    if (domain.trim()) parts.push(`site:${domain.trim()}`)
    if (inurl.trim()) parts.push(`inurl:${inurl.trim()}`)
    if (intitle.trim()) parts.push(`intitle:${intitle.trim()}`)
    if (filetype.trim()) parts.push(`filetype:${filetype.trim().replace(/^\./, "")}`)
    if (exact.trim()) parts.push(`"${exact.trim()}"`)
    if (terms.trim()) parts.push(terms.trim())
    if (exclude.trim())
      exclude
        .split(/[\s,]+/)
        .filter(Boolean)
        .forEach((t) => parts.push(`-${t}`))
    return parts.join(" ")
  }, [domain, terms, filetype, inurl, intitle, exact, exclude])

  const engineUrl = (base: string, q: string) => base.replace("{q}", encodeURIComponent(q))

  const [lookup, setLookup] = useState("")

  const TABS: Array<{ id: Tab; label: string; Icon: typeof Search }> = [
    { id: "dork", label: "Dork Builder", Icon: Search },
    { id: "operators", label: "Operators", Icon: FileSearch },
    { id: "framework", label: "OSINT Framework", Icon: Folder },
    { id: "lookups", label: "Lookups", Icon: Globe },
    { id: "se", label: "SE / SECTF", Icon: Users },
  ]

  return (
    <SuiteShell
      title="OSINT SUITE"
      status="real"
      nav={
        <>
          <SuiteNavLink href="/offsec" label="Arsenal" />
          <SuiteNavLink href="/offsec/graph" label="Entity Graph" />
          <SuiteNavLink href="/offsec/engagements" label="Engagements" />
          <SuiteNavLink href="/offsec/toolkit" label="Data Toolkit" />
        </>
      }
    >
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} type="button" className="ghost-btn" data-on={tab === id} onClick={() => setTab(id)}>
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>

        {tab === "dork" && (
          <div className="ghost-glass ghost-brackets space-y-3 rounded-[2px] p-4">
            <div className="ghost-label">Google dork builder</div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input className="ghost-input font-mono" placeholder="site: domain" value={domain} onChange={(e) => setDomain(e.target.value)} />
              <input className="ghost-input font-mono" placeholder="filetype (pdf, sql, env…)" value={filetype} onChange={(e) => setFiletype(e.target.value)} />
              <input className="ghost-input font-mono" placeholder="inurl:" value={inurl} onChange={(e) => setInurl(e.target.value)} />
              <input className="ghost-input font-mono" placeholder="intitle:" value={intitle} onChange={(e) => setIntitle(e.target.value)} />
              <input className="ghost-input font-mono" placeholder='exact phrase ("...")' value={exact} onChange={(e) => setExact(e.target.value)} />
              <input className="ghost-input font-mono" placeholder="exclude (space/comma sep)" value={exclude} onChange={(e) => setExclude(e.target.value)} />
              <input className="ghost-input font-mono sm:col-span-2" placeholder="free terms" value={terms} onChange={(e) => setTerms(e.target.value)} />
            </div>
            <div className="rounded-[2px] border border-[color:var(--ghost-line)] bg-black/40 p-2">
              <div className="mb-1 flex items-center justify-between">
                <span className="ghost-label">query</span>
                <button type="button" className="ghost-icon-btn" onClick={() => copy(builtDork, "dork")} title="Copy">
                  {k === "dork" ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>
              <pre className="whitespace-pre-wrap break-words font-mono text-[12px] text-[color:var(--ghost-ink)]">{builtDork || "—"}</pre>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SEARCH_ENGINES.map((e) => (
                <a
                  key={e.name}
                  className="ghost-btn"
                  href={builtDork ? engineUrl(e.url, builtDork) : undefined}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-disabled={!builtDork}
                  onClick={(ev) => !builtDork && ev.preventDefault()}
                >
                  <ExternalLink size={11} /> {e.name}
                </a>
              ))}
            </div>
            <div className="space-y-1">
              <div className="ghost-label">Recipes (click to load into builder's free-terms as a starting point)</div>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {DORK_RECIPES.map((r) => {
                  const q = r.query.replace("{domain}", domain.trim() || "{domain}")
                  return (
                    <div key={r.label} className="rounded-[2px] border border-[color:var(--ghost-line)] bg-black/30 p-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-[color:var(--ghost-ink)]">{r.label}</span>
                        <div className="flex items-center gap-1">
                          <span className="ghost-chip">{r.category}</span>
                          <button type="button" className="ghost-icon-btn" onClick={() => copy(q, r.label)} title="Copy">
                            {k === r.label ? <Check size={11} /> : <Copy size={11} />}
                          </button>
                        </div>
                      </div>
                      <pre className="mt-1 whitespace-pre-wrap break-words font-mono text-[10px] text-[color:var(--ghost-dim)]">{q}</pre>
                      {r.note && <div className="mt-0.5 text-[10px] text-[color:var(--ghost-faint)]">{r.note}</div>}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {tab === "operators" && (
          <div className="ghost-glass ghost-brackets rounded-[2px] p-4">
            <div className="ghost-label mb-2">Search operator reference</div>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {GOOGLE_OPERATORS.map((o) => (
                <div key={o.op} className="flex items-start justify-between gap-2 rounded-[2px] border border-[color:var(--ghost-line)] bg-black/30 p-2">
                  <div className="min-w-0">
                    <span className="font-mono text-[12px] text-[color:var(--ghost-accent)]">{o.op}</span>
                    <span className="ml-2 text-[11px] text-[color:var(--ghost-dim)]">{o.desc}</span>
                    <div className="mt-0.5 font-mono text-[10px] text-[color:var(--ghost-faint)]">{o.example}</div>
                  </div>
                  <button type="button" className="ghost-icon-btn" onClick={() => copy(o.example, o.op)}>
                    {k === o.op ? <Check size={11} /> : <Copy size={11} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "framework" && (
          <div className="ghost-glass ghost-brackets rounded-[2px] p-4">
            <div className="ghost-label mb-2">OSINT Framework (categories → tools)</div>
            <div className="space-y-1">
              {OSINT_TREE.map((n) => (
                <TreeNode key={n.name} node={n} />
              ))}
            </div>
            <div className="mt-3 text-[10px] text-[color:var(--ghost-faint)]">
              Structure after osintframework.com (Justin Nordine). Each tool belongs to its own author/license.
            </div>
          </div>
        )}

        {tab === "lookups" && (
          <div className="ghost-glass ghost-brackets space-y-3 rounded-[2px] p-4">
            <div className="ghost-label">Username / email / phone — open-source launchers</div>
            <input className="ghost-input font-mono" placeholder="selector (username, email, or +phone)" value={lookup} onChange={(e) => setLookup(e.target.value)} />
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                { t: "Sherlock", c: `sherlock ${lookup || "{username}"} --output sherlock.txt`, l: "https://github.com/sherlock-project/sherlock" },
                { t: "Maigret", c: `maigret ${lookup || "{username}"} --html`, l: "https://github.com/soxoj/maigret" },
                { t: "holehe (email)", c: `holehe ${lookup || "{email}"}`, l: "https://github.com/megadose/holehe" },
                { t: "GHunt (email)", c: `ghunt email ${lookup || "{email}"}`, l: "https://github.com/mxrch/GHunt" },
                { t: "PhoneInfoga", c: `phoneinfoga scan -n '${lookup || "{number}"}'`, l: "https://github.com/sundowndev/phoneinfoga" },
                { t: "theHarvester", c: `theHarvester -d ${lookup || "{domain}"} -b bing,duckduckgo,crtsh`, l: "https://github.com/laramies/theHarvester" },
              ].map((x) => (
                <div key={x.t} className="rounded-[2px] border border-[color:var(--ghost-line)] bg-black/30 p-2">
                  <div className="mb-1 flex items-center justify-between">
                    <a href={x.l} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-[11px] text-[color:var(--ghost-ink)] hover:underline">
                      {x.t} <ExternalLink size={10} className="opacity-60" />
                    </a>
                    <button type="button" className="ghost-icon-btn" onClick={() => copy(x.c, x.t)}>
                      {k === x.t ? <Check size={11} /> : <Copy size={11} />}
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap break-words font-mono text-[10px] text-[color:var(--ghost-dim)]">{x.c}</pre>
                </div>
              ))}
            </div>
            <div className="text-[10px] text-[color:var(--ghost-faint)]">
              Run these locally in your own authorized terminal. Do not mass-scrape or violate site ToS. Passive lookup only.
            </div>
          </div>
        )}

        {tab === "se" && (
          <div className="ghost-glass ghost-brackets space-y-3 rounded-[2px] p-4">
            <div className="ghost-label">Social engineering / SECTF — training &amp; authorized engagements only</div>
            <p className="text-[11px] text-[color:var(--ghost-dim)]">
              Workflow for DEF CON Social Engineering Community SECTF and the Trace Labs OSINT Search Party CTF.
              Pretexts and sock puppets are fictional; never target, defraud, or harm a real person. Record scope and
              authorization in{" "}
              <a href="/offsec/engagements" className="underline">
                Engagements
              </a>
              .
            </p>
            <div className="flex flex-wrap gap-1.5">
              <a className="ghost-btn" href="https://www.tracelabs.org/initiatives/osint-vm" target="_blank" rel="noreferrer noopener">
                <ExternalLink size={11} /> Trace Labs OSINT VM
              </a>
              <a className="ghost-btn" href="https://www.social-engineer.org/" target="_blank" rel="noreferrer noopener">
                <ExternalLink size={11} /> Social-Engineer.org
              </a>
            </div>
            <div className="rounded-[2px] border border-[color:var(--ghost-line)] bg-black/40 p-2">
              <div className="mb-1 flex items-center justify-between">
                <span className="ghost-label">Report template</span>
                <button type="button" className="ghost-icon-btn" onClick={() => copy(SECTF_REPORT_TEMPLATE, "sectf")}>
                  {k === "sectf" ? <Check size={12} /> : <Copy size={12} />}
                </button>
              </div>
              <pre className="ghost-scroll max-h-80 overflow-auto whitespace-pre-wrap break-words font-mono text-[10px] text-[color:var(--ghost-dim)]">{SECTF_REPORT_TEMPLATE}</pre>
            </div>
          </div>
        )}
      </div>
    </SuiteShell>
  )
}
