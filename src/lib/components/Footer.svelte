<svelte:options runes={true}></svelte:options>
<script module>
declare const __GIT_HASH__: string
declare const __GIT_BRANCH__: string
</script>
<script lang="ts">
const commitHash = __GIT_HASH__ ?? import.meta.env.VITE_GIT_HASH as string
const branch = __GIT_BRANCH__ ?? import.meta.env.VITE_GIT_BRANCH as string

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
	{#if !(branch.includes("main") || branch.includes("master")) }
		<p>This is a development branch. <a href="https://lrcsync.iamas.ink">Goto main</a></p>
	{/if}
	<p><a href="https://iamas.ink/support">support me <span class="nounderline">❣️</span></a></p>
</div>

<style>
.footer {
  color: rgba(255, 255, 255, 0.486);
  span {
    display: inline-block;

    :nth-child(1) {
      transform: translateY(0.2rem) rotate(5deg);
    }
    :nth-child(2) {
      transform: translateX(-0.3rem);
    }
  }

  a {
    color: rgba(100, 61, 172, 0.534);
    text-decoration: none;
    &:hover {
      text-decoration: revert;
      .nounderline {
        text-decoration: none;
      }
    }
  }

  padding-top: 1rem;
  padding-bottom: 1rem;
  padding-left: 10rem;
}
</style>
