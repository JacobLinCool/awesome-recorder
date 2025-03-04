import { Recorder } from "../dist/index.js";

// DOM elements
const startBtn = document.getElementById("start-btn");
const stopBtn = document.getElementById("stop-btn");
const statusEl = document.getElementById("status");
const speakingIndicator = document.getElementById("speaking-indicator");
const recordingsList = document.getElementById("recordings-list");

// Create recorder instance
const recorder = new Recorder();

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

// Start recording function
async function startRecording() {
  try {
    statusEl.textContent = "Initializing...";
    startBtn.disabled = true;

    // Preload resources
    await recorder.preload();

    statusEl.textContent = "Recording...";
    stopBtn.disabled = false;

    // Start recording and process chunks as they come
    for await (const audioFile of recorder.start()) {
      console.log("Recording chunk received", audioFile);
      addRecordingToList(audioFile);
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
  label.textContent = `Recording ${timestamp}`;

  const downloadBtn = document.createElement("a");
  downloadBtn.textContent = "Download";
  downloadBtn.href = audio.src;
  downloadBtn.download = `recording-${Date.now()}.mp3`;
  downloadBtn.className = "download-btn";

  recordingItem.appendChild(label);
  recordingItem.appendChild(audio);
  recordingItem.appendChild(downloadBtn);

  recordingsList.prepend(recordingItem);
}

// Initial setup
document.addEventListener("DOMContentLoaded", () => {
  statusEl.textContent = "Ready";
});
