# Awesome Recorder

A powerful, lightweight library for recording audio with voice activity detection that automatically segments speech, and output small-sized and compact MP3 files.

## Features

- ✅ **Voice Activity Detection** - Automatically detects speech and segments recordings
- ✅ **MP3 Encoding** - Produces optimized MP3 files ready for use
- ✅ **Simple API** - Easy to use with async/await and async generators
- ✅ **Event System** - Real-time speech state notifications
- ✅ **TypeScript Support** - Full type definitions included

## Installation

```bash
npm install awesome-recorder
# or
yarn add awesome-recorder
# or
pnpm add awesome-recorder
```

## Basic Usage

```javascript
import { Recorder } from "awesome-recorder";

// Create a recorder instance
const recorder = new Recorder();

// Optional: listen for speech state changes
recorder.on("speechStateChanged", ({ isSpeaking }) => {
  console.log("User is speaking:", isSpeaking);
});

// Start recording
async function startRecording() {
  try {
    // Loop through audio chunks as they are detected
    for await (const audioChunk of recorder.start()) {
      console.log("Speech detected:", audioChunk);

      // Each audioChunk is an MP3 File object that you can:
      const audioURL = URL.createObjectURL(audioChunk);

      // Play the audio
      const audio = new Audio(audioURL);
      audio.play();

      // Or save it
      const link = document.createElement("a");
      link.href = audioURL;
      link.download = `recording-${Date.now()}.mp3`;
      link.click();
    }
  } catch (error) {
    console.error("Recording failed:", error);
  }
}

// Stop recording when needed
function stopRecording() {
  recorder.stop();
}
```

## API Reference

### `Recorder` Class

The main class for handling audio recording with voice activity detection.

#### Constructor

```typescript
constructor(vadOptions?: Partial<RealTimeVADOptions>)
```

- `vadOptions`: Optional configuration for voice activity detection

#### Methods

- `preload(): Promise<void>` - Preloads necessary resources (VAD model and FFmpeg)
- `start(): AsyncGenerator<File, void>` - Starts recording and yields MP3 files when speech is detected
- `stop(): Promise<void>` - Stops recording
- `on(event: string, callback: Function): void` - Subscribe to events
- `off(event: string, callback: Function): void` - Unsubscribe from events

#### Events

- `speechStateChanged` - Emitted when speech state changes with `{ isSpeaking: boolean }`

### Utility Functions

- `float32ArrayToWav(float32Array: Float32Array, sampleRate?: number, numChannels?: number): Blob`
- `wav2mp3(wav: Blob | File | ArrayBuffer): Promise<File>`
- `setCoreURL(url: string): void` - Set custom URL for FFmpeg core
- `setWasmURL(url: string): void` - Set custom URL for FFmpeg WASM module

## Advanced Usage

### Custom VAD Options

```javascript
import { Recorder } from "awesome-recorder";

const recorder = new Recorder({
  positiveSpeechThreshold: 0.8, // Confidence threshold for positive speech detection
  negativeSpeechThreshold: 0.8, // Confidence threshold for negative speech detection
  minSpeechFrames: 5, // Minimum frames of speech before triggering onSpeechStart
  preSpeechPadFrames: 10, // Keep this many frames before speech detection
  redemptionFrames: 8, // Allow this many non-speech frames before ending segment
});
```

### Handling Audio Processing Progress

```javascript
import { Recorder } from "awesome-recorder";

// Preload resources before user interaction
async function prepareRecording() {
  const recorder = new Recorder();
  await recorder.preload();
  console.log("Ready to record!");
  return recorder;
}

// Process audio as it's captured
async function processAudio(recorder) {
  let recordingCount = 0;

  for await (const audioFile of recorder.start()) {
    recordingCount++;

    // Upload to server
    const formData = new FormData();
    formData.append("audio", audioFile);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      console.log(`Segment ${recordingCount} uploaded:`, await response.json());
    } catch (error) {
      console.error("Upload failed:", error);
    }
  }
}
```

## Browser Support

This library works in all modern browsers that support:

- WebAssembly
- AudioContext
- MediaDevices API

## Bundlers

When using Vite, you need to exclude `@ffmpeg/ffmpeg` from optimization:

### Vite

```js
// vite.config.js
export default {
  optimizeDeps: {
    exclude: ["@ffmpeg/ffmpeg"],
  },
};
```

## Example

Check out the [example directory](./example/) for working example:

- [Simple Recorder](./example/) - Basic recording functionality

## License

MIT
