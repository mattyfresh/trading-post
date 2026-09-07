import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";

// Shared flat config for the whole pnpm workspace (frontend + backend).
export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/build/**", "**/node_modules/**", "backend/prisma/migrations/**", "**/*.d.ts"],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Allow intentionally-unused vars/args prefixed with `_`.
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },

  {
    files: ["frontend/**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },

  {
    files: ["backend/**/*.ts"],
    languageOptions: {
      globals: globals.node,
    },
  },

  prettierConfig,
);
