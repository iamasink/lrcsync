<script lang="ts">
interface Props {
	open?: boolean
}

let { open = $bindable(false) }: Props = $props()
</script>

{#if open}
	<div class="drag-overlay">
		<div class="middle">
			<p>
				Drop files anywhere
			</p>
			<p class="hint">You can also drop both .lrc and audio at the same time :)</p>
			<p class="hint-small">I'll even ignore cover images and stuff ＜3</p>
		</div>
		<div style="top: 5%; left: 5%">Drop files anywhere</div>
		<!--
			<div style="bottom: 5%; left: 5%">Drop files anywhere</div>
			<div style="top: 5%; right: 5%">Drop files anywhere</div>
			<div style="bottom: 5%; right: 5%">Drop files anywhere</div>
		-->
	</div>
{/if}

<style>
.drag-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.884);
  font-size: 4rem;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  pointer-events: all;
  display: flex;

  div {
    position: fixed;

    .hint {
      color: var(--text);
      font-weight: lighter;
      font-size: 3rem;
    }
    .hint-small {
      color: var(--text-muted);
      font-weight: light;
      font-size: 2rem;
    }
  }
}
</style>
