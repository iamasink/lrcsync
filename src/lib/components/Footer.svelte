<svelte:options runes={true}></svelte:options>

<script lang="ts">
const commitHash = import.meta.env.VITE_GIT_HASH
const branch = import.meta.env.VITE_GIT_BRANCH
let commitBranchText = $state("")
if (commitHash) {
	commitBranchText += `commit: ${commitHash}`
	if (branch) {
		commitBranchText += ` on ${branch}`
	}
	commitBranchText += "."
}
</script>

<div class="footer">
	<p>lrcsync - made with <span class="kity"><span>🎷</span><span>🐈</span></span> by <a href="https://iamas.ink">sink</a>.</p>
	<p><a href="https://github.com/iamasink/lrcsync">GitHub</a> <span>{commitBranchText}</span></p>
	{#if branch.includes("dev")}
		<p>This is a development branch. <a href="https://lrcsync.iamas.ink">Goto main</a></p>
	{/if}
	<p><a href="https://iamas.ink/support">support me <span class="nounderline">❣️</span></a></p>
</div>
