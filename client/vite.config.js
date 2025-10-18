import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { reactComponentTagger } from "react-component-tagger"

export default defineConfig({
	base: "./",
	plugins: [react(), reactComponentTagger()],
	build: {
		chunkSizeWarningLimit: 10240,
	},
})
