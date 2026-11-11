/**
 * # Pre-Commit Hooks
 *
 * Pre-commit hooks are scripts that run automatically before a commit is made to your
 * repository. They can prevent commits that would introduce errors. Adding pre-commit
 * hooks would:
 *
 * 1. **Run ESLint before each commit** - Catch import errors and other issues
 *    - Prevents committing code with linting errors
 *
 * 2. **Run TypeScript type checking** - Ensure all types are correct
 *    - Prevents committing code with type errors
 *
 * 3. **Run tests related to changed files** - Ensure changes don't break existing functionality
 *    - Prevents committing code that breaks tests
 *
 * 4. **Format code automatically** - Ensure consistent code style
 *    - Uses Prettier to format code before commit
 *
 * ## Implementation
 *
 * This would use husky and lint-staged:
 *
 * ```bash
 * npm install --save-dev husky lint-staged
 * npx husky install
 * npm pkg set scripts.prepare="husky install"
 * ```
 *
 * Then create a .husky/pre-commit file:
 *
 * ```bash
 * #!/bin/sh
 * . "$(dirname "$0")/_/husky.sh"
 *
 * npx lint-staged
 * ```
 *
 * And configure lint-staged in package.json:
 *
 * ```json
 * {
 *   "lint-staged": {
 *     "*.{ts,tsx}": [
 *       "eslint --fix",
 *       "prettier --write",
 *       "tsc --noEmit"
 *     ]
 *   }
 * }
 * ```
 */
