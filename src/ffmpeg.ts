import { FFmpeg } from "@ffmpeg/ffmpeg";
import debug from "debug";

const log = debug("recorder");
const ffmpegLog = log.extend("ffmpeg");

let _coreURL: string | undefined =
  "https://cdn.jsdelivr.net/npm/@hinagiku/ffmpeg-core@0.12.6-pcm-mpeg-only/dist/esm/ffmpeg-core.js";
let _wasmURL: string | undefined =
  "https://cdn.jsdelivr.net/npm/@hinagiku/ffmpeg-core@0.12.6-pcm-mpeg-only/dist/esm/ffmpeg-core.wasm";

export function setCoreURL(url: string) {
  _coreURL = url;
}

export function setWasmURL(url: string) {
  _wasmURL = url;
}

let _ffmpeg: FFmpeg | null = null;
function ffmpeg(): FFmpeg {
  if (!_ffmpeg) {
    _ffmpeg = new FFmpeg();
    _ffmpeg.on("log", ({ message }) => ffmpegLog(message));
  }
  return _ffmpeg;
}

let pInitFFmpeg: Promise<FFmpeg> | null = null;
/**
 * Loads and initializes the FFmpeg instance.
 * @returns A promise that resolves to the initialized FFmpeg instance.
 */
export async function getFFmpeg(): Promise<FFmpeg> {
  if (pInitFFmpeg) {
    return pInitFFmpeg;
  }
  pInitFFmpeg = (async () => {
    const ff = ffmpeg();
    await ff.load();
    await ff.exec(["-formats"]);
    return ff;
  })();
  return pInitFFmpeg;
}
