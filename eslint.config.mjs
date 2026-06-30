import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // We fetch on-chain data on mount (no data-fetching library), which
      // legitimately calls setState from an effect to drive loading/error
      // state. This rule is over-eager for that pattern.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
