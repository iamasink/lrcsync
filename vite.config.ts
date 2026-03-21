import devtoolsJson from 'vite-plugin-devtools-json';
import { sveltekit } from '@sveltejs/kit/vite';
import { execSync } from 'child_process';
import { defineConfig } from 'vite';

function getGitInfo() {
	let hash, branch
	let buildDate = new Date().toISOString()
	console.log("build date: ", buildDate)

	try {
		hash = execSync('git rev-parse HEAD').toString().trim()
		console.log('Git hash:', hash)
	} catch (err) {
		console.warn('Failed to get Git hash:', err)
	}

	try {
		const b = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
		if (b !== 'HEAD') {
			branch = b
			console.log('Git branch:', branch)
		} else {
			console.log('Detached HEAD, branch unknown')
		}
	} catch (err) {
		console.warn('Failed to get Git branch:', err)
	}

	if (!branch && process.env.CF_PAGES_BRANCH) {
		branch = process.env.CF_PAGES_BRANCH
		console.log('Branch from CF_PAGES_BRANCH env:', branch)
	}

	if (!buildDate) {
		try {
			buildDate = execSync('git log -1 --format=%cI').toString().trim()
			console.log('using git commit date:', buildDate)
		} catch (err) {
			console.warn('Failed to get Git commit date, using:', buildDate)
		}
	}

	return { hash, branch, buildDate }
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