/**
 * # ESLint Import Rules
 *
 * ESLint import rules are specialized linting rules that specifically target how imports
 * are structured and used in your codebase. Adding these rules would:
 *
 * 1. **Automatically detect incorrect imports** - For example, it would flag:
 *    - `import { Link } from "next/navigation"` as incorrect
 *    - `import Link from "next/link"` as correct
 *
 * 2. **Enforce consistent import ordering** - Group imports by:
 *    - Built-in Node modules first
 *    - External npm packages second
 *    - Internal project imports third
 *    - Relative imports last
 *
 * 3. **Prevent unused imports** - Remove imports that aren't being used
 *
 * 4. **Prevent duplicate imports** - Combine multiple imports from the same module
 *
 * 5. **Enforce import sorting** - Keep imports alphabetically sorted for better readability
 *
 * ## Implementation
 *
 * This would be added to your .eslintrc.js file:
 *
 * ```js
 * module.exports = {
 *   // ... other ESLint config
 *   rules: {
 *     // ... other rules
 *     "import/order": ["error", {
 *       "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
 *       "newlines-between": "always",
 *       "alphabetize": { "order": "asc", "caseInsensitive": true }
 *     }],
 *     "import/no-duplicates": "error",
 *     "import/no-unresolved": "error",
 *     "import/named": "error"
 *   }
 * }
 * ```
 *
 * This would require installing:
 * - eslint-plugin-import
 */
