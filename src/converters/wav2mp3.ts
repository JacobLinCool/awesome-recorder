import { getFFmpeg } from "../ffmpeg";

/**
 * Converts a WAV audio blob/file or ArrayBuffer to an MP3 File.
 * @param wav - The WAV audio input.
 * @returns A promise that resolves to an MP3 File.
 */
export async function wav2mp3(wav: Blob | File | ArrayBuffer): Promise<File> {
  const ff = await getFFmpeg();
  ff.writeFile(
    "audio.wav",
    new Uint8Array(wav instanceof ArrayBuffer ? wav : await wav.arrayBuffer()),
  );
  await ff.exec(["-i", "audio.wav", "audio.mp3"]);
  const data = await ff.readFile("audio.mp3");
  return new File([data], "audio.mp3", { type: "audio/mpeg" });
}
