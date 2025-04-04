import { MicVAD, type RealTimeVADOptions } from "@ricky0123/vad-web";
import debug from "debug";
import EventEmitter from "eventemitter3";
import { float32ArrayToWav } from "./converters/float32ToWav";
import { wav2mp3 } from "./converters/wav2mp3";
import { getFFmpeg } from "./ffmpeg";

const log = debug("recorder");

/**
 * Events emitted by the Recorder class
 */
export interface RecorderEvents {
  speechStateChanged: (state: { isSpeaking: boolean }) => void;
}

export type OutputFormat = "mp3" | "wav" | "pcm";

type MP3File = File & {
  type: "audio/mpeg";
};
type WAVFile = File & {
  type: "audio/wav";
};

export interface OutputFormatMap {
  mp3: MP3File;
  wav: WAVFile;
  pcm: Float32Array;
}

/**
 * Recorder class for audio recording with voice activity detection.
 *
 * Usage:
 * 1. Call preload() to initialize the VAD and FFmpeg resources.
 * 2. Call start() to begin recording. The start method returns an async generator
 *    that yields MP3 files whenever a speech segment is detected.
 * 3. Call stop() to cease recording.
 */
export class Recorder extends EventEmitter<RecorderEvents> {
  private vad: Promise<MicVAD> | null = null;
  private _started = false;
  private stopGenerator: () => void = () => {};
  private innerOnSpeechStart: () => void | Promise<void> = () => {};
  private innerOnSpeechEnd: (audio: Float32Array) => void | Promise<void> =
    () => {};
  private innerOnVADMisfire: () => void | Promise<void> = () => {};
  private vadOptions: Partial<RealTimeVADOptions> = {};
  private preprocessAudio: (audio: Float32Array) => Float32Array;

  /**
   * @param options - Optional configuration for the VAD and audio preprocessing.
   * options.preprocessAudio is a callback to process audio before encoding.
   */
  constructor(
    options?: Partial<RealTimeVADOptions> & {
      preprocessAudio?: (audio: Float32Array) => Float32Array;
    },
  ) {
    const { preprocessAudio, ...vadOptions } = options || {};
    super();
    this.vadOptions = vadOptions;
    // Default behavior: trim last 8000 samples
    this.preprocessAudio =
      preprocessAudio ?? ((audio) => audio.slice(0, -2000));
  }

  /**
   * Indicates whether the recorder is currently started.
   * @returns True if recording has started.
   */
  public get started() {
    return this._started;
  }

  /**
   * Preloads the necessary resources for recording.
   * This method is idempotent, and will be called by start() internally.
   * @returns Resolves when VAD and FFmpeg are ready.
   */
  public async preload() {
    if (!this.vad) {
      this.vad = MicVAD.new({
        model: "v5",
        submitUserSpeechOnPause: true,
        onSpeechStart: async (...args) => {
          await this.innerOnSpeechStart(...args);
          await this.vadOptions?.onSpeechStart?.(...args);
        },
        onSpeechEnd: async (...args) => {
          await this.innerOnSpeechEnd(...args);
          await this.vadOptions?.onSpeechEnd?.(...args);
        },
        onVADMisfire: async () => {
          await this.innerOnVADMisfire();
          await this.vadOptions?.onVADMisfire?.();
        },
        ...this.vadOptions,
      });
    }
    await getFFmpeg();
    await this.vad;
  }

  /**
   * Starts the recorder.
   * Returns an async generator that yields an MP3 File for each detected speech segment.
   * @throws If the recorder is already started or if initialization fails.
   * @returns Async generator yielding recorded MP3 files.
   */
  public async *start<T extends OutputFormat = "mp3">(
    outputFormat: T = "mp3" as T,
  ): AsyncGenerator<OutputFormatMap[T], void> {
    if (this._started) {
      throw new Error("Already started");
    }
    this._started = true;

    await this.preload();

    if (!this.vad) {
      throw new Error("VAD is not initialized");
    }

    let resolve: (data: OutputFormatMap[T]) => void;
    let chunkPromise = new Promise<OutputFormatMap[T]>((res) => {
      resolve = res;
    });

    const stopGenerator = new Promise<void>((res) => {
      this.stopGenerator = () => res();
    });

    let isSpeaking = false;

    const vad = await this.vad;
    this.innerOnSpeechStart = async () => {
      isSpeaking = true;
      this.emit("speechStateChanged", { isSpeaking });
    };
    this.innerOnSpeechEnd = async (audio: Float32Array) => {
      isSpeaking = false;
      this.emit("speechStateChanged", { isSpeaking });

      const processedAudio = this.preprocessAudio(audio);

      let result: OutputFormatMap[T];
      switch (outputFormat) {
        case "pcm":
          result = processedAudio as OutputFormatMap[T];
          break;
        case "wav":
          const wav = float32ArrayToWav(processedAudio);
          result = new File([wav], "audio.wav", {
            type: "audio/wav",
          }) as OutputFormatMap[T];
          break;
        case "mp3":
          const wavForMp3 = float32ArrayToWav(processedAudio);
          result = (await wav2mp3(wavForMp3)) as OutputFormatMap[T];
          break;
      }

      resolve(result);
      chunkPromise = new Promise<OutputFormatMap[T]>((res) => {
        resolve = res;
      });
    };
    this.innerOnVADMisfire = async () => {
      isSpeaking = false;
      this.emit("speechStateChanged", { isSpeaking });
    };

    vad.start();

    // 200ms delay to wait for the last audio chunk (if any)
    const stopper = stopGenerator.then(
      () => new Promise<undefined>((r) => setTimeout(r, 200)),
    );
    while (true) {
      try {
        const res = await Promise.race([chunkPromise, stopper]);
        if (res === undefined) {
          break;
        }
        yield res;
      } catch (error) {
        log("[ERROR]", error);
        break;
      }
    }

    if (isSpeaking) {
      isSpeaking = false;
      this.emit("speechStateChanged", { isSpeaking });
    }

    this._started = false;
  }

  /**
   * Stops the recorder and pauses the VAD.
   */
  public async stop() {
    this.stopGenerator();
    const vad = await this.vad;
    if (vad) {
      vad.pause();
    } else {
      log("[WARN] Recorder is not started");
    }
  }
}
