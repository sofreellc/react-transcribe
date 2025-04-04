import * as React from 'react';
import { useEffect, useRef, useState, ReactNode } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { TranscriptInfo, SpeechToggleInfo } from '../types';

export interface SpeechToTextProps {
  /** Callback triggered when speech is detected */
  onSpeech?: (info: TranscriptInfo) => void;
  /** Callback triggered when speech recognition is toggled on/off */
  onSpeechToggle?: (info: SpeechToggleInfo) => void;
  /** React children or render function */
  children?: ReactNode | ((state: SpeechToTextState) => ReactNode);
  /** Duration of silence before considering speech paused (ms) */
  silenceDuration?: number;
  /** Maximum silence duration before stopping (ms) */
  maxSilenceDuration?: number;
  /** When to start showing countdown (ms) */
  countdownThreshold?: number;
  /** Recognition language */
  language?: string;
}

export interface SpeechToTextState {
  listening: boolean;
  isActivelySpeaking: boolean;
  silenceCountdown: number | null;
  transcript: string;
  interimTranscript: string;
  browserSupportsSpeechRecognition: boolean;
  resetTranscript: () => void;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
}

const SpeechToText: React.FC<SpeechToTextProps> = ({
  onSpeech,
  onSpeechToggle,
  children,
  silenceDuration = 1000, // Duration of silence before stopping transmission (ms)
  maxSilenceDuration = 60000, // Maximum allowed silence duration (60 seconds)
  countdownThreshold = 10000, // Show countdown when 10 seconds remaining
  language = 'en-US'
}) => {
    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition,
        interimTranscript
    } = useSpeechRecognition({
        transcribing: true,
        clearTranscriptOnListen: false,
    });

    const [isActivelySpeaking, setIsActivelySpeaking] = useState<boolean>(false);
    const [silenceCountdown, setSilenceCountdown] = useState<number | null>(null);
    const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const activeStreamingRef = useRef<boolean>(false);
    const maxSilenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const latestTranscript = useRef<string | null>(null);

    // Handle transcript updates
    useEffect(() => {
        latestTranscript.current = transcript;
        const safeResetTranscript = () => {
            resetTranscript();
            return latestTranscript.current;
        };

        if (transcript && !activeStreamingRef.current) {
            activeStreamingRef.current = true;
            setIsActivelySpeaking(true);
            resetSilenceTimeout();
        } else if (transcript) {
            resetSilenceTimeout();
        }
        if(interimTranscript || transcript) {
            onSpeech?.({ 
                transcript, 
                interimTranscript, 
                resetTranscript: safeResetTranscript 
            });
        }
    }, [transcript, interimTranscript, listening, resetTranscript, onSpeech]);

    // Speech recognition cleanup
    useEffect(() => { 
        return () => { 
            stopListening(); 
        }; 
    }, []);

    const startListening = () => {
        SpeechRecognition.startListening({ continuous: true, language })
            .then(() => { 
                onSpeechToggle?.({ isListening: true, type: 'device' });
            })
            .catch(console.error);
    }
    
    const stopListening = () => {
        SpeechRecognition.stopListening()
            .then(() => { 
                onSpeechToggle?.({ isListening: false, type: 'device' }); 
            });
    }
    
    const toggleListening = () => {
        if (listening) {
            stopListening();
        } else {
            startListening();
        }
    };

    const handleSilence = () => {
        if (activeStreamingRef.current) {
            activeStreamingRef.current = false;
            setIsActivelySpeaking(false);

            // Start the max silence countdown
            if (!maxSilenceTimeoutRef.current) {
                const startTime = Date.now();

                maxSilenceTimeoutRef.current = setTimeout(() => {
                    stopListening();
                }, maxSilenceDuration);

                // Start countdown interval when approaching timeout
                countdownIntervalRef.current = setInterval(() => {
                    const elapsed = Date.now() - startTime;
                    const remaining = Math.ceil((maxSilenceDuration - elapsed) / 1000);

                    if (remaining <= countdownThreshold / 1000) {
                        setSilenceCountdown(remaining);
                    }

                    if (elapsed >= maxSilenceDuration) {
                        if (countdownIntervalRef.current) {
                            clearInterval(countdownIntervalRef.current);
                        }
                        setSilenceCountdown(null);
                    }
                }, 1000);
            }
        }
    };

    const resetSilenceTimeout = () => {
        // Reset short silence timeout
        if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
        }
        silenceTimeoutRef.current = setTimeout(handleSilence, silenceDuration);

        // Reset max silence timeout and countdown
        if (maxSilenceTimeoutRef.current) {
            clearTimeout(maxSilenceTimeoutRef.current);
            maxSilenceTimeoutRef.current = null;
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
            setSilenceCountdown(null);
        }
    };

    if (!browserSupportsSpeechRecognition) {
        return null;
    }

    const state: SpeechToTextState = {
        listening,
        isActivelySpeaking,
        silenceCountdown,
        transcript,
        interimTranscript,
        browserSupportsSpeechRecognition,
        resetTranscript,
        startListening,
        stopListening,
        toggleListening
    };

    return children ? (
        <>{typeof children === 'function' ? (children as Function)(state) : children}</>
    ) : null;
};

export default SpeechToText;