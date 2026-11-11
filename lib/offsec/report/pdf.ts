/**
 * Minimal, dependency-free PDF writer (Helvetica/Helvetica-Bold, auto-paginated).
 * Produces a valid single-stream-per-page PDF Buffer for pentest reports.
 * Text only — honest, no images/fonts embedding. Good enough for a readable
 * deliverable without adding a heavyweight PDF dependency.
 */

export interface PdfLine {
  text: string
  size?: number
  bold?: boolean
  indent?: number
  gapBefore?: number
}

const PAGE_W = 612
const PAGE_H = 792
const MARGIN = 54
const LEADING = 1.35

function escapePdf(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)").replace(/\r/g, "")
}

// crude width estimate for Helvetica (avg ~0.5em) for wrapping
function wrap(text: string, size: number, maxWidth: number): string[] {
  const perChar = size * 0.5
  const maxChars = Math.max(8, Math.floor(maxWidth / perChar))
  const words = text.split(/\s+/)
  const lines: string[] = []
  let cur = ""
  for (const w of words) {
    const candidate = cur ? cur + " " + w : w
    if (candidate.length > maxChars && cur) {
      lines.push(cur)
      cur = w
    } else if (candidate.length > maxChars) {
      // single long word, hard split
      for (let i = 0; i < w.length; i += maxChars) lines.push(w.slice(i, i + maxChars))
      cur = ""
    } else {
      cur = candidate
    }
  }
  if (cur) lines.push(cur)
  return lines.length ? lines : [""]
}

export function renderPdf(lines: PdfLine[], opts?: { title?: string }): Buffer {
  const pages: string[][] = [] // each page = array of content ops
  let page: string[] = []
  let y = PAGE_H - MARGIN

  const newPage = () => {
    pages.push(page)
    page = []
    y = PAGE_H - MARGIN
  }

  for (const ln of lines) {
    const size = ln.size ?? 10
    const indent = ln.indent ?? 0
    const font = ln.bold ? "F2" : "F1"
    const maxWidth = PAGE_W - MARGIN * 2 - indent
    y -= ln.gapBefore ?? 0
    const wrapped = wrap(ln.text, size, maxWidth)
    for (const seg of wrapped) {
      const lineH = size * LEADING
      if (y - lineH < MARGIN) newPage()
      y -= lineH
      page.push(
        `BT /${font} ${size} Tf 1 0 0 1 ${MARGIN + indent} ${y.toFixed(1)} Tm (${escapePdf(seg)}) Tj ET`,
      )
    }
  }
  pages.push(page)

  // assemble PDF objects
  const objs: string[] = []
  const fontObjN = 0 // placeholders filled below
  // We'll build: 1 Catalog, 2 Pages, then per page: Page + Content, then 2 fonts.
  const nPages = pages.length
  // object numbering:
  // 1 = Catalog, 2 = Pages
  // for page i (0-based): pageObj = 3 + i*2, contentObj = 4 + i*2
  // fonts after pages: fontF1 = 3 + nPages*2, fontF2 = 4 + nPages*2
  const f1 = 3 + nPages * 2
  const f2 = 4 + nPages * 2

  const kids = pages.map((_, i) => `${3 + i * 2} 0 R`).join(" ")
  objs[1] = `<< /Type /Catalog /Pages 2 0 R >>`
  objs[2] = `<< /Type /Pages /Count ${nPages} /Kids [${kids}] >>`
  pages.forEach((content, i) => {
    const pageObjN = 3 + i * 2
    const contentObjN = 4 + i * 2
    const stream = content.join("\n")
    objs[pageObjN] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
      `/Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${contentObjN} 0 R >>`
    objs[contentObjN] = `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`
  })
  objs[f1] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`
  objs[f2] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`

  // serialize with xref
  let out = `%PDF-1.4\n`
  const offsets: number[] = []
  const total = objs.length - 1
  for (let n = 1; n <= total; n++) {
    offsets[n] = Buffer.byteLength(out)
    out += `${n} 0 obj\n${objs[n]}\nendobj\n`
  }
  const xrefStart = Buffer.byteLength(out)
  out += `xref\n0 ${total + 1}\n`
  out += `0000000000 65535 f \n`
  for (let n = 1; n <= total; n++) {
    out += `${String(offsets[n]).padStart(10, "0")} 00000 n \n`
  }
  out += `trailer\n<< /Size ${total + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`
  void fontObjN
  void opts
  return Buffer.from(out, "latin1")
}
