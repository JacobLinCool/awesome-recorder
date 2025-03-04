# 🎙️ Awesome Recorder

[![npm](https://img.shields.io/npm/v/awesome-recorder?style=flat-square)](https://www.npmjs.com/package/awesome-recorder)

> **Effortless audio recording with built-in Voice Activity Detection and optimized MP3 outputs in modern browsers.**

`awesome-recorder` is a lightweight, powerful JavaScript library designed for seamless audio capture directly in the browser. It automatically segments speech using advanced Voice Activity Detection (VAD), encoding spoken audio into compact MP3 files—perfect for web apps, voice assistants, transcription services, and more.

## ✨ Key Features

- 🎤 **Automatic Voice Activity Detection** — Precisely detects and segments speech.
- 📦 **Compact MP3 Encoding** — Small, optimized MP3 audio outputs.
- ⚡ **Simple Async API** — Easy-to-use with async generators and async/await.
- 🚀 **Event-Driven** — Real-time speech state notifications.
- 🛠️ **Full TypeScript Support** — Complete type definitions included.
- 🌐 **WebAssembly Optimized** — Ultra-lightweight custom FFmpeg WASM (~1.2 MB).

## 🚩 Installation

```bash
npm install awesome-recorder
# or
yarn add awesome-recorder
# or
pnpm add awesome-recorder
```

## 🧑‍💻 Quick Start

```typescript
import { Recorder } from "awesome-recorder";

const recorder = new Recorder();

// Listen for speech state changes (optional)
recorder.on("speechStateChanged", ({ isSpeaking }) => {
  console.log(`User is speaking: ${isSpeaking}`);
});

// Start capturing audio segments
async function startRecording() {
  try {
    for await (const audioChunk of recorder.start()) {
      console.log("Detected speech segment:", audioChunk);

      // Play audio directly in browser
      const audio = new Audio(URL.createObjectURL(audioChunk));
      audio.play();

      // Or trigger immediate download
      const link = document.createElement("a");
      link.href = URL.createObjectURL(audioChunk);
      link.download = `speech-${Date.now()}.mp3`;
      link.click();
    }
  } catch (error) {
    console.error("Recording Error:", error);
  }
}

// Stop recording gracefully
function stopRecording() {
  recorder.stop();
}
```

## 📚 API Reference

### `Recorder` Class

Main class for handling recording and voice detection.

```typescript
new Recorder(vadOptions?: Partial<RealTimeVADOptions> & { preprocessAudio?: (audio: Float32Array) => Float32Array });
```

#### Options

- **`preprocessAudio`**  
  Optional callback to process audio data before encoding.  
  Default behavior trims the last 2000 samples.  
  You can remove unwanted tail noise, apply custom modifications, or access raw audio data with this callback.

#### Methods

- **`.preload(): Promise<void>`**  
  Preloads the VAD model and FFmpeg WASM module.

- **`.start(): AsyncGenerator<File, void>`**  
  Starts audio recording, yielding MP3 segments upon speech detection.

- **`.stop(): Promise<void>`**  
  Stops audio recording.

- **`.on(event: string, callback: Function): void`**  
  Subscribes to recorder events.

- **`.off(event: string, callback: Function): void`**  
  Unsubscribes from recorder events.

#### Events

- **`speechStateChanged`**  
  Emitted with `{ isSpeaking: boolean }` when speech state changes.

## 🌐 WebAssembly Optimized

By default, `awesome-recorder` uses an optimized, custom FFmpeg WASM build from [`@hinagiku/ffmpeg-core`](https://www.npmjs.com/package/@hinagiku/ffmpeg-core), specifically tailored for minimal size (~1.2 MB). However, you can easily use your own custom build if preferred:

```typescript
import { setCoreURL, setWasmURL } from "awesome-recorder";

setCoreURL("https://your-cdn.com/ffmpeg-core.js");
setWasmURL("https://your-cdn.com/ffmpeg-core.wasm");
```

## 🚀 Advanced Usage

### Custom Voice Activity Detection Options

Fine-tune detection sensitivity and timing:

```typescript
const recorder = new Recorder({
  positiveSpeechThreshold: 0.9,
  negativeSpeechThreshold: 0.7,
  minSpeechFrames: 5,
  preSpeechPadFrames: 15,
  redemptionFrames: 10,
});
```

See the [`@ricky0123/vad-web` Documentation](https://docs.vad.ricky0123.com/user-guide/api/#micvad) for detailed configuration options.

## ☁️ Uploading Audio Segments

Stream recorded segments directly to your backend:

```typescript
async function streamSegments(recorder: Recorder) {
  let segmentCount = 0;

  for await (const audioFile of recorder.start()) {
    segmentCount++;

    const formData = new FormData();
    formData.append("segment", audioFile);

    fetch("/api/upload-segment", {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => console.log(`Uploaded segment ${segmentCount}:`, data))
      .catch((err) => console.error("Upload failed:", err));
  }
}
```

## 🌍 Browser Compatibility

Compatible with modern browsers supporting:

- ✅ WebAssembly (WASM)
- ✅ Web Audio API (`AudioContext`)
- ✅ MediaDevices API

## ⚠️ Notes for Bundlers

### Vite

When using Vite, exclude `@ffmpeg/ffmpeg` from dependency optimization:

```js
// vite.config.js
export default {
  optimizeDeps: {
    exclude: ["@ffmpeg/ffmpeg"],
  },
};
```

## 🔍 Example Project

Check out the practical demo in the [example](./example/) directory:

- **[👉 Simple Recorder Demo](https://jacoblincool.github.io/awesome-recorder/)**

## 📄 License

Released under the **MIT License**.

✨ **Enjoy effortless, efficient, and powerful audio recording in your web apps!** ✨
