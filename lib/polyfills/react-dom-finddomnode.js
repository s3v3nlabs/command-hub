/**
 * Re-export real react-dom and provide findDOMNode for kepler.gl / react-sortable-hoc on React 19.
 * Imports the CJS entry by absolute filesystem path to avoid alias recursion.
 */
import { createRequire } from "module"
const require = createRequire(import.meta.url)
const ReactDOM = require("react-dom")

function findDOMNode(componentOrElement) {
  if (componentOrElement == null) return null
  if (typeof componentOrElement.nodeType === "number") return componentOrElement
  try {
    const fiber = componentOrElement._reactInternals || componentOrElement._reactInternalFiber
    let node = fiber
    while (node) {
      if (node.stateNode && typeof node.stateNode.nodeType === "number") return node.stateNode
      node = node.child
    }
  } catch {
    /* ignore */
  }
  return null
}

export default ReactDOM
export const {
  createPortal,
  flushSync,
  hydrate,
  render,
  unmountComponentAtNode,
  version,
  createRoot,
  hydrateRoot,
  preload,
  preinit,
  preconnect,
  prefetchDNS,
  preinitModule,
} = ReactDOM
export { findDOMNode }
