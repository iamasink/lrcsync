<svelte:options runes={true}></svelte:options>
<script module>
declare const __GIT_HASH__: string
declare const __GIT_BRANCH__: string
declare const __BUILD_DATE__: string
</script>
<script lang="ts">
import { onMount } from "svelte"

const commitHash = __GIT_HASH__ ?? (import.meta.env["VITE_GIT_HASH"] as string)
const branch = __GIT_BRANCH__ ?? (import.meta.env["VITE_GIT_BRANCH"] as string)
const buildDate = __BUILD_DATE__ ?? (import.meta.env["VITE_BUILD_DATE"] as string)
const shortCommitHash = commitHash?.slice(0, 7)
const commitUrl = `https://github.com/iamasink/lrcsync/commit/${commitHash}`
const isDevelopmentBranch = Boolean(branch && !["HEAD", "main", "master"].includes(branch))

let buildDateText = $state("")

onMount(() => {
	if (buildDate) {
		buildDateText = `, built at ${new Date(buildDate)}`
	}
})
</script>

<div class="footer">
	<p>
		made with <span class="kity">
			<span><span>🎷</span></span><span><span>🐈</span></span>
		</span> by <a href="https://iamas.ink">sink</a>.
	</p>
	<p>
		<a href="https://github.com/iamasink/lrcsync">GitHub</a>
		{#if commitHash}
			<span>
				commit: <a href={commitUrl} title={commitHash}>{shortCommitHash}</a>{#if branch}{` on ${branch}`}{/if}{buildDateText}.
			</span>
		{/if}
	</p>
	{#if isDevelopmentBranch}
		<p>This is a development branch. <a href="https://lrcsync.iamas.ink">Go to main site</a></p>
	{/if}
	<p><a href="https://iamas.ink/support">support me</a></p>
</div>

<style>
.footer {
  color: rgba(255, 255, 255, 0.486);
  padding: 1rem 0 1rem 10rem;

  .kity {
    font-size: 1.4em;
    position: relative;
    display: inline-block;
    width: 1em;
    height: 1em;
    vertical-align: -0.25em;

    > span {
      position: absolute;
      inset: 0;
      line-height: 1;
      transform-origin: 0 0;
      &::before {
        content: "";
        position: absolute;
        inset: 0;
        background: var(--emoji-image) center / contain no-repeat;
        opacity: 0.486;
        pointer-events: none;
      }

      span {
        position: relative;
        color: transparent;

        &::selection {
          background: Highlight;
        }
      }
    }
    > span:nth-child(1) {
      --emoji-image: url("/twemoji/1f3b7.svg");
      transform: translate(-0.1378em, 0.5356em) rotate(-47.29deg) scale(0.5953);
    }
    > span:nth-child(2) {
      --emoji-image: url("/twemoji/1f408.svg");
      transform: translate(0.4104em, -0.0239em) rotate(13.06deg) scale(0.5953);
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
