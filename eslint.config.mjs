import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  { ignores: ["**/node_modules/**", "client/dist/**", "client/public/**", "extras/**"] },

  js.configs.recommended,

  {
    // Warn, not error: express error middleware takes a `next` it never calls.
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", caughtErrors: "none" }],
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },

  {
    files: ["services/**/*.js", "tests/**/*.js"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: { ...globals.node, fetch: "readonly" },
    },
  },

  {
    files: ["client/src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-unused-vars": ["warn", { varsIgnorePattern: "^[A-Z_]", argsIgnorePattern: "^_" }],
    },
  },

  {
    files: ["client/*.config.js"],
    languageOptions: { sourceType: "module", globals: globals.node },
  },

  {
    // Root-level config files: ecosystem.config.cjs, this file.
    files: ["*.cjs", "*.mjs"],
    languageOptions: { globals: globals.node },
  },
];
