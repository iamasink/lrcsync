// @ts-check

import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
	js.configs.recommended,
	...tseslint.configs.recommendedTypeChecked,

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

			"@typescript-eslint/ban-ts-comment": "off",
			"@typescript-eslint/no-unsafe-call": "off",
			"@typescript-eslint/no-unsafe-member-access": "off",
			"@typescript-eslint/no-unsafe-assignment": "off",

			"eqeqeq": ["error", "always", { null: "ignore" }],
			"no-shadow": "off",
			"@typescript-eslint/no-shadow": "error",

			"@typescript-eslint/no-explicit-any": "warn",
			// "@typescript-eslint/no-unnecessary-condition": "warn",
			"@typescript-eslint/consistent-type-imports": "warn",
			"@typescript-eslint/no-unsafe-assignment": "off",

			"@typescript-eslint/prefer-promise-reject-errors": "error",

			"no-irregular-whitespace": ["warn", { "skipComments": true, "skipRegExps": true, }],
			"@typescript-eslint/switch-exhaustiveness-check": "error",

			// "@typescript-eslint/no-non-null-assertion": "warn",
			"@typescript-eslint/restrict-template-expressions": ["warn", { allowNumber: true }],
		},
	},
]);