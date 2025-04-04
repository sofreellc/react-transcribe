export type TranscriptInfo = {
  transcript: string;
  interimTranscript: string;
  resetTranscript: () => string | null;
};

export type SpeechToggleInfo = {
  isListening: boolean;
  type: 'device';
};
