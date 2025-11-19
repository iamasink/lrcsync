<script lang="ts">
import createModule from "@transcribe/shout"
import { FileTranscriber } from "@transcribe/transcriber"
import { onMount } from "svelte"

let transcriber: FileTranscriber
let running = false
let text = $state("")

interface Props {
	file: string | File | null
}

let { file = $bindable() }: Props = $props()

onMount(async () => {
	transcriber = new FileTranscriber({ createModule, model: "/models/ggml-base.bin" })

	await transcriber.init()
})

$effect(() => {
	console.log(file)
})

async function transcribe() {
	if (!transcriber?.isReady) return
	if (!file) {
		text += "No file!"
		return
	}

	text += "Transcribing..."

	// transcribe the file
	// there must be at least one user interaction (e.g click) before you can call this function
	const result = await transcriber.transcribe(file, { lang: "en" })

	// do something with the result
	text = result.transcription.map((t) => t.text).join(" \n")
}
</script>

<button onclick={transcribe}>Go</button>

<pre>{text}</pre>
