import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import { baseConfig } from "./base.mjs";

export const nestConfig = defineConfig([
  ...baseConfig,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/interface-name-prefix": "off",
    },
  },
]);
