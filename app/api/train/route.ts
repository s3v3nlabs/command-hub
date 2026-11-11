export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * /api/train — alias folded into /api/symtrain (Teacher→Student).
 * Re-exports handlers; same contract.
 */
export { GET, POST } from "../symtrain/route"
