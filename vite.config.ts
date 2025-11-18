import { sveltekit } from '@sveltejs/kit/vite'
import { execSync } from 'child_process'
import { defineConfig } from 'vite'

export default defineConfig({
	plugins: [sveltekit()],
	build: { minify: false },
	define: {
		__GIT_HASH__: JSON.stringify(execSync('git rev-parse HEAD').toString().trim()),
		__GIT_BRANCH__: JSON.stringify(execSync('git symbolic-ref --short HEAD').toString().trim()),
	}
})
