import { defineConfig } from "vite";

/**
 * Vite configuration for running the examples
 */
export default defineConfig({
  base: "",
  root: "example",
  // Exclude FFmpeg from optimization to prevent issues
  optimizeDeps: {
    exclude: ["@ffmpeg/ffmpeg"],
  },
});
