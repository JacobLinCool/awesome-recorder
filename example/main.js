import { OutputFormat, Recorder, float32ArrayToWav } from "../dist/index.js";

// DOM elements
const startBtn = document.getElementById("start-btn");
const stopBtn = document.getElementById("stop-btn");
const statusEl = document.getElementById("status");
const speakingIndicator = document.getElementById("speaking-indicator");
const recordingsList = document.getElementById("recordings-list");
const formatSelect = document.getElementById("format-select");

// Create recorder instance
const recorder = new Recorder({ preSpeechPadFrames: 12 });

// Listen for speech state changes
recorder.on("speechStateChanged", ({ isSpeaking }) => {
  console.log("Speech state changed", isSpeaking);
  if (isSpeaking) {
    speakingIndicator.classList.add("active");
  } else {
    speakingIndicator.classList.remove("active");
  }
});

// Event listeners
startBtn.addEventListener("click", startRecording);
stopBtn.addEventListener("click", stopRecording);

// Store PCM chunks during recording
let pcmChunks = [];

// Start recording function
async function startRecording() {
  try {
    pcmChunks = []; // Reset chunks when starting new recording
    statusEl.textContent = "Initializing...";
    startBtn.disabled = true;

    await recorder.preload();
    statusEl.textContent = "Recording...";
    stopBtn.disabled = false;

    const format = formatSelect.value;
    for await (const audio of recorder.start(format)) {
      console.log("Recording chunk received", audio);
      if (format === OutputFormat.PCM) {
        addPCMToList(audio);
      } else {
        addRecordingToList(audio);
      }
    }
  } catch (error) {
    console.error("Recording failed:", error);
    statusEl.textContent = `Error: ${error.message}`;
    resetButtons();
  }
}

// Stop recording function
async function stopRecording() {
  statusEl.textContent = "Stopping...";
  await recorder.stop();

  // If we were recording PCM, create a combined WAV file
  if (formatSelect.value === OutputFormat.PCM && pcmChunks.length > 0) {
    const totalLength = pcmChunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const combined = new Float32Array(totalLength);
    let offset = 0;

    for (const chunk of pcmChunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    const wav = float32ArrayToWav(combined);
    const file = new File([wav], "combined.wav", { type: "audio/wav" });

    const combinedItem = document.createElement("div");
    combinedItem.className = "recording-item highlight";

    const label = document.createElement("div");
    label.textContent = "Combined Recording (WAV)";

    const info = document.createElement("div");
    info.textContent = `Total Duration: ${(totalLength / 16000).toFixed(2)}s`;

    const audio = document.createElement("audio");
    audio.controls = true;
    audio.src = URL.createObjectURL(file);

    const downloadBtn = document.createElement("a");
    downloadBtn.textContent = "Download Combined WAV";
    downloadBtn.href = audio.src;
    downloadBtn.download = `combined-${Date.now()}.wav`;
    downloadBtn.className = "download-btn";

    combinedItem.appendChild(label);
    combinedItem.appendChild(info);
    combinedItem.appendChild(audio);
    combinedItem.appendChild(downloadBtn);

    recordingsList.prepend(combinedItem);
  }

  statusEl.textContent = "Ready";
  resetButtons();
}

// Helper to reset button states
function resetButtons() {
  startBtn.disabled = false;
  stopBtn.disabled = true;
}

// Add a recording to the list
function addRecordingToList(file) {
  const recordingItem = document.createElement("div");
  recordingItem.className = "recording-item";

  const audio = document.createElement("audio");
  audio.controls = true;

  const URL = window.URL || window.webkitURL;
  audio.src = URL.createObjectURL(file);

  const timestamp = new Date().toLocaleTimeString();
  const label = document.createElement("div");
  label.textContent = `Recording ${timestamp} (${file.type})`;

  const downloadBtn = document.createElement("a");
  downloadBtn.textContent = "Download";
  downloadBtn.href = audio.src;
  downloadBtn.download = `recording-${Date.now()}.${file.type.split("/")[1]}`;
  downloadBtn.className = "download-btn";

  recordingItem.appendChild(label);
  recordingItem.appendChild(audio);
  recordingItem.appendChild(downloadBtn);

  recordingsList.prepend(recordingItem);
}

// Add PCM data to the list
function addPCMToList(float32Array) {
  pcmChunks.push(float32Array); // Store the chunk

  const recordingItem = document.createElement("div");
  recordingItem.className = "recording-item";

  const timestamp = new Date().toLocaleTimeString();
  const label = document.createElement("div");
  label.textContent = `Recording ${timestamp} (PCM Raw Data)`;

  const info = document.createElement("div");
  info.textContent = `Samples: ${float32Array.length}, Duration: ${(float32Array.length / 16000).toFixed(2)}s`;

  const downloadBtn = document.createElement("a");
  downloadBtn.textContent = "Download Raw Data";
  downloadBtn.href = URL.createObjectURL(new Blob([float32Array.buffer]));
  downloadBtn.download = `recording-${Date.now()}.raw`;
  downloadBtn.className = "download-btn";

  recordingItem.appendChild(label);
  recordingItem.appendChild(info);
  recordingItem.appendChild(downloadBtn);

  recordingsList.prepend(recordingItem);
}

// Initial setup
document.addEventListener("DOMContentLoaded", () => {
  statusEl.textContent = "Ready";
});
