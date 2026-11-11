# SINGULAR/TY Import Documentation

## Overview

This document outlines the standard import patterns for the SINGULAR/TY Defense Solutions platform. Following these patterns ensures consistent code style and prevents common errors.

## Next.js Import Patterns

### Correct Import Patterns

\`\`\`typescript
// Importing Link component
import Link from "next/link"  // ✅ CORRECT

// Importing navigation hooks
import { usePathname, useRouter, useSearchParams } from "next/navigation"  // ✅ CORRECT

// Importing dynamic component loader
import dynamic from "next/dynamic"  // ✅ CORRECT

// Importing Image component
import Image from "next/image"  // ✅ CORRECT

// Importing Head component
import Head from "next/head"  // ✅ CORRECT
\`\`\`

### Common Mistakes to Avoid

\`\`\`typescript
// ❌ INCORRECT - Link is a default export
import { Link } from "next/navigation"  

// ❌ INCORRECT - Link is not in navigation
import Link from "next/navigation"  

// ❌ INCORRECT - useRouter is not in router
import { useRouter } from "next/router"  
\`\`\`

## React Import Patterns

\`\`\`typescript
// Importing React hooks
import { useState, useEffect, useRef, useMemo, useCallback } from "react"  // ✅ CORRECT

// Importing React types
import { ReactNode, FC, ComponentProps } from "react"  // ✅ CORRECT

// Importing Suspense and error boundaries
import { Suspense, lazy } from "react"  // ✅ CORRECT
\`\`\`

## Three.js Import Patterns

\`\`\`typescript
// Importing from Three.js
import * as THREE from "three"  // ✅ CORRECT

// Importing specific Three.js components
import { Vector3, Mesh, MeshStandardMaterial } from "three"  // ✅ CORRECT

// Importing React Three Fiber
import { Canvas, useFrame, useThree } from "@react-three/fiber"  // ✅ CORRECT

// Importing Drei helpers
import { OrbitControls, Text, Environment } from "@react-three/drei"  // ✅ CORRECT
\`\`\`

## Internal Import Patterns

\`\`\`typescript
// Importing from lib directory
import { cn } from "@/lib/utils"  // ✅ CORRECT

// Importing UI components
import { Button } from "@/components/ui/button"  // ✅ CORRECT

// Importing types
import type { SystemStatus } from "@/types/system"  // ✅ CORRECT - use 'type' keyword
\`\`\`

## Best Practices

1. **Group imports** by external libraries, then internal modules
2. **Sort imports** alphabetically within each group
3. **Use type imports** when importing only TypeScript types
4. **Use absolute imports** with the `@/` prefix for internal modules
5. **Avoid relative imports** with multiple levels (`../../`)

## ESLint Rules

Our ESLint configuration includes rules to enforce these patterns:

\`\`\`json
{
  "rules": {
    "import/order": ["error", {
      "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
      "newlines-between": "always",
      "alphabetize": { "order": "asc", "caseInsensitive": true }
    }],
    "import/no-duplicates": "error",
    "import/no-unresolved": "error",
    "import/named": "error"
  }
}
\`\`\`

## Troubleshooting Common Import Errors

### "Module not found" Error

Check:
- Spelling of the module name
- That the module is installed
- Path is correct (case-sensitive)

### "Cannot find module" or "Cannot find name" Error

Check:
- TypeScript types are installed
- Import statement uses correct syntax
- Module exists at the specified path

### "Link is not a component" Error

This usually means you've imported Link incorrectly:
\`\`\`typescript
// ❌ INCORRECT
import { Link } from "next/navigation"

// ✅ CORRECT
import Link from "next/link"
\`\`\`

## Vault Integration

When adding new modules to the vault system, ensure imports follow these patterns to maintain compatibility with the self-healing agent core.
\`\`\`

Now, let me explain each of the suggested actions:
