import * as React from 'react';
import { render, screen } from '@testing-library/react';
import SpeechToText from '../components/SpeechToText';

// Add testing-library to the Jest setup
import '@testing-library/jest-dom';

// Mock react-speech-recognition
jest.mock('react-speech-recognition', () => {
  const mockStartListening = jest.fn(() => Promise.resolve());
  const mockStopListening = jest.fn(() => Promise.resolve());
  
  return {
    __esModule: true,
    default: {
      startListening: mockStartListening,
      stopListening: mockStopListening,
    },
    useSpeechRecognition: () => ({
      transcript: 'hello world',
      listening: false,
      resetTranscript: jest.fn(),
      browserSupportsSpeechRecognition: true,
      interimTranscript: '',
    }),
  };
});

describe('SpeechToText', () => {
  // Mock callbacks
  const mockOnSpeech = jest.fn();
  const mockOnSpeechToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children with correct state', () => {
    render(
      <SpeechToText 
        onSpeech={mockOnSpeech} 
        onSpeechToggle={mockOnSpeechToggle}
      >
        {(state) => (
          <div>
            <div data-testid="listening">{state.listening.toString()}</div>
            <div data-testid="transcript">{state.transcript}</div>
            <button data-testid="toggle" onClick={state.toggleListening}>Toggle</button>
          </div>
        )}
      </SpeechToText>
    );

    expect(screen.getByTestId('listening')).toHaveTextContent('false');
    expect(screen.getByTestId('transcript')).toHaveTextContent('hello world');
  });

  it('accepts and renders direct children', () => {
    render(
      <SpeechToText 
        onSpeech={mockOnSpeech} 
        onSpeechToggle={mockOnSpeechToggle}
      >
        <div data-testid="child">Child Content</div>
      </SpeechToText>
    );

    expect(screen.getByTestId('child')).toHaveTextContent('Child Content');
  });

  it('returns null when no children provided', () => {
    const { container } = render(
      <SpeechToText 
        onSpeech={mockOnSpeech} 
        onSpeechToggle={mockOnSpeechToggle}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('calls onSpeech callback when there is transcript', () => {
    // This test relies on the useEffect firing during render
    render(
      <SpeechToText 
        onSpeech={mockOnSpeech} 
        onSpeechToggle={mockOnSpeechToggle}
      >
        <div>Test</div>
      </SpeechToText>
    );

    // Since our mock returns transcript="hello world", the onSpeech callback should be called
    expect(mockOnSpeech).toHaveBeenCalledWith(expect.objectContaining({
      transcript: 'hello world',
      interimTranscript: '',
      resetTranscript: expect.any(Function)
    }));
  });

  it('handles custom silence duration settings', () => {
    // This is mostly to verify the component accepts these props
    const { container } = render(
      <SpeechToText 
        onSpeech={mockOnSpeech}
        onSpeechToggle={mockOnSpeechToggle}
        silenceDuration={2000}
        maxSilenceDuration={30000}
        countdownThreshold={5000}
        language="fr-FR"
      >
        <div>Test</div>
      </SpeechToText>
    );

    expect(container.textContent).toBe('Test');
  });

  // Tests for the specific silence detection behavior would need more complex
  // test setup with mocked timers - can be added as needed
});
