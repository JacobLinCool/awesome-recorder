/**
 * Converts a Float32Array to a WAV Blob.
 * @param float32Array - The raw PCM samples.
 * @param sampleRate - The sample rate of the audio. Defaults to 16000.
 * @param numChannels - The number of audio channels. Defaults to 1 (mono).
 * @returns A Blob representing the WAV audio data, including the header.
 */
export function float32ArrayToWav(
  float32Array: Float32Array,
  sampleRate: number = 16000,
  numChannels: number = 1,
): Blob {
  const bitsPerSample = 16; // 16-bit PCM
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;

  const buffer = new ArrayBuffer(44 + float32Array.length * 2);
  const view = new DataView(buffer);

  // Write WAV header
  let offset = 0;
  const writeString = (str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset++, str.charCodeAt(i));
    }
  };

  writeString("RIFF"); // ChunkID
  view.setUint32(offset, 36 + float32Array.length * 2, true);
  offset += 4; // ChunkSize
  writeString("WAVE"); // Format
  writeString("fmt "); // Subchunk1ID
  view.setUint32(offset, 16, true);
  offset += 4; // Subchunk1Size
  view.setUint16(offset, 1, true);
  offset += 2; // AudioFormat (1 = PCM)
  view.setUint16(offset, numChannels, true);
  offset += 2; // NumChannels
  view.setUint32(offset, sampleRate, true);
  offset += 4; // SampleRate
  view.setUint32(offset, byteRate, true);
  offset += 4; // ByteRate
  view.setUint16(offset, blockAlign, true);
  offset += 2; // BlockAlign
  view.setUint16(offset, bitsPerSample, true);
  offset += 2; // BitsPerSample
  writeString("data"); // Subchunk2ID
  view.setUint32(offset, float32Array.length * 2, true);
  offset += 4; // Subchunk2Size

  // Write PCM data
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    let sample = Math.max(-1, Math.min(1, float32Array[i])); // Clamp to -1..1
    sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff; // Scale to 16-bit
    view.setInt16(offset, sample, true); // Write sample
  }

  return new Blob([buffer], { type: "audio/wav" });
}
