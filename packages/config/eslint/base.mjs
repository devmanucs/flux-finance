import { defineConfig, globalIgnores } from "eslint/config";

export const baseConfig = defineConfig([
  globalIgnores([
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/.next/**",
    "**/.turbo/**",
  ]),
]);
