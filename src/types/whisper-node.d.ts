declare module 'whisper-node' {
  interface WhisperOptions {
    modelName?: string;         // e.g., "tiny.en", "base.en"
    whisperOptions?: Record<string, any>;  // pass options like language, word_timestamps
  }

  function whisper(filePath: string, options?: WhisperOptions): Promise<any>;

  export default whisper;
}
