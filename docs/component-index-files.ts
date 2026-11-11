/**
 * # Component Index Files
 *
 * Component index files (also called "barrel exports") are files that re-export
 * components from a directory, allowing for cleaner imports. Adding component
 * index files would:
 *
 * 1. **Simplify imports** - Instead of:
 *    ```typescript
 *    import { Button } from '@/components/ui/button'
 *    import { Card } from '@/components/ui/card'
 *    import { Input } from '@/components/ui/input'
 *    ```
 *
 *    You could write:
 *    ```typescript
 *    import { Button, Card, Input } from '@/components/ui'
 *    ```
 *
 * 2. **Hide implementation details** - Consumers don't need to know file structure
 *
 * 3. **Make refactoring easier** - Can move files without changing import paths
 *
 * 4. **Provide a clear API** - Index files document what's available from a module
 *
 * ## Implementation
 *
 * For each component directory, create an index.ts file:
 *
 * ```typescript
 * // components/ui/index.ts
 * export { Button } from './button'
 * export { Card, CardHeader, CardContent, CardFooter } from './card'
 * export { Input } from './input'
 * // etc.
 * ```
 *
 * Then in components/index.ts:
 *
 * ```typescript
 * export * from './ui'
 * export * from './dashboard'
 * export * from './layout'
 * // etc.
 * ```
 *
 * This creates a clean, hierarchical export structure.
 */
