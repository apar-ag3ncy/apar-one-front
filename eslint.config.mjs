import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

// Flat config for `next lint` / `eslint .` (Next 15 + ESLint 9). Same rule set
// create-next-app ships: Core Web Vitals + TypeScript.
const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const config = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  { ignores: [".next/**", "node_modules/**", "e2e/**", "scripts/**", "docs/**", "next-env.d.ts"] },
  {
    rules: {
      // App Router: the Google Fonts <link>s live in app/layout.tsx, which wraps
      // every route - the rule only knows the pages/_document.js convention.
      "@next/next/no-page-custom-font": "off",
    },
  },
];

export default config;
