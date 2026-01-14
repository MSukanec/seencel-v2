import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

import checkFile from "eslint-plugin-check-file";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      "check-file": checkFile,
    },
    rules: {
      "check-file/filename-naming-convention": [
        "error",
        {
          "src/components/**/*.{ts,tsx}": "KEBAB_CASE",
          "src/features/**/*.{ts,tsx}": "KEBAB_CASE",
          "src/app/**/*.{ts,tsx}": "KEBAB_CASE",
        },
      ],
      "check-file/folder-naming-convention": [
        "error",
        {
          "src/components/**/": "KEBAB_CASE",
          "src/features/**/": "KEBAB_CASE",
        },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  {
    files: ["src/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*", "@/app/*"],
              message: "UI Components must not depend on Features or App Logic. Pass data via props.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
