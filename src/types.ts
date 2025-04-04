export type TranscriptInfo = {
  transcript: string;
  interimTranscript: string;
  resetTranscript: () => void;
};

export type SpeechToggleInfo = {
  isListening: boolean;
  type: 'device';
};