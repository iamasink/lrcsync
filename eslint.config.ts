// @ts-check

import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
	js.configs.recommended,
	// ...tseslint.configs.recommendedTypeChecked,

	{
		files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],

		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},
			parserOptions: {
				projectService: true,
			},
		},

		rules: {
			"no-var": "error",
			"prefer-const": "error",

			"@typescript-eslint/no-unsafe-call": "off",
			"@typescript-eslint/no-unsafe-member-access": "off",
			"@typescript-eslint/no-unsafe-argument": "off",

			"eqeqeq": ["error", "always", { null: "ignore" }],
			"no-shadow": "off",
			"@typescript-eslint/no-shadow": "error",

			"@typescript-eslint/no-explicit-any": "warn",
			"@typescript-eslint/no-unnecessary-condition": "warn",
			"@typescript-eslint/consistent-type-imports": "warn",
			// "@typescript-eslint/no-unsafe-assignment": "off",

			"@typescript-eslint/no-unused-vars": "off",
			"@typescript-eslint/ban-ts-comment": "warn",

			"@typescript-eslint/prefer-promise-reject-errors": "warn",

			"no-irregular-whitespace": ["warn", { "skipComments": true, "skipRegExps": true, }],
			"@typescript-eslint/switch-exhaustiveness-check": "error",

			"@typescript-eslint/no-non-null-assertion": "off",
			"@typescript-eslint/restrict-template-expressions": ["warn", { allowNumber: true }],
		},
	},
]);