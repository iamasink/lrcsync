import devtoolsJson from 'vite-plugin-devtools-json';
import { sveltekit } from '@sveltejs/kit/vite';
import { execSync } from 'child_process';
import { defineConfig } from 'vite';

function getGitInfo() {
	try {
		const hash = execSync('git rev-parse HEAD').toString().trim();
		const branch = execSync('git symbolic-ref --short HEAD').toString().trim()
		const buildDate = new Date().toISOString();

		return { hash, branch, buildDate: buildDate };
	} catch {
		return { hash: undefined, branch: undefined, buildDate: undefined };
	}
}

const { hash, branch, buildDate } = getGitInfo();

export default defineConfig({
	plugins: [sveltekit(), devtoolsJson()],
	build: { minify: false },
	define: {
		__GIT_HASH__: JSON.stringify(hash),
		__GIT_BRANCH__: JSON.stringify(branch),
		__BUILD_DATE__: JSON.stringify(buildDate)
	},
	server: {
		fs: {
			allow: ["./packages", "./src", "./node_modules"]
		}
	}
})