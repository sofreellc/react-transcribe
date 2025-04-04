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

    // Define stopListening first since it doesn't depend on other callbacks
    const stopListening = React.useCallback(() => {
        SpeechRecognition.stopListening()
            .then(() => { 
                onSpeechToggle?.({ isListening: false, type: 'device' }); 
            })
            .catch((error) => {
                console.error('Error stopping speech recognition:', error);
            });
    }, [onSpeechToggle]);

    // Define handleSilence next since it depends on stopListening
    const handleSilence = React.useCallback(() => {
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
    }, [countdownThreshold, maxSilenceDuration, stopListening]);

    // resetSilenceTimeout depends on handleSilence
    const resetSilenceTimeout = React.useCallback(() => {
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
    }, [silenceDuration, handleSilence]);

    const startListening = React.useCallback(() => {
        SpeechRecognition.startListening({ continuous: true, language })
            .then(() => { 
                onSpeechToggle?.({ isListening: true, type: 'device' });
            })
            .catch((error) => {
                console.error('Error starting speech recognition:', error);
            });
    }, [language, onSpeechToggle]);

    const toggleListening = React.useCallback(() => {
        if (listening) {
            stopListening();
        } else {
            startListening();
        }
    }, [listening, startListening, stopListening]);

    // Handle transcript updates
    useEffect(() => {
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
                resetTranscript
            });
        }
    }, [transcript, interimTranscript, resetTranscript, onSpeech, resetSilenceTimeout]);

    // Speech recognition cleanup
    useEffect(() => { 
        return () => { 
            stopListening(); 
        }; 
    }, [stopListening]);

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
        <>{typeof children === 'function' 
            ? (children as (state: SpeechToTextState) => React.ReactNode)(state) 
            : children}</>
    ) : null;
};

export default SpeechToText;