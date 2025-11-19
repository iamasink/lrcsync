import devtoolsJson from 'vite-plugin-devtools-json';
import { sveltekit } from '@sveltejs/kit/vite';
import { execSync } from 'child_process';
import { defineConfig } from 'vite';

function getGitInfo() {
	try {
		const hash = execSync('git rev-parse HEAD').toString().trim();
		const branch = execSync('git symbolic-ref --short HEAD').toString().trim();

		return { hash, branch };
	} catch {
		return { hash: undefined, branch: undefined };
	}
}

const { hash, branch } = getGitInfo();

export default defineConfig({
	plugins: [sveltekit(), devtoolsJson()],
	build: { minify: false },
	define: {
		__GIT_HASH__: JSON.stringify(hash),
		__GIT_BRANCH__: JSON.stringify(branch)
	}
});
