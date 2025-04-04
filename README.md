# React Transcribe

A React component for speech-to-text transcription with silence detection using the browser's Web Speech API.

## Installation

```bash
npm install react-transcribe
# or
yarn add react-transcribe
```

## Features

- Real-time speech transcription
- Silence detection with automatic pausing
- Countdown timer for maximum silence duration
- Customizable UI through render props pattern
- Callback-based communication

## Usage

```jsx
import { SpeechToText } from 'react-transcribe';
import { useState } from 'react';

const MyComponent = () => {
  const [transcript, setTranscript] = useState('');

  // Handle speech updates
  const handleSpeech = (info) => {
    setTranscript(info.transcript);
    console.log('Interim:', info.interimTranscript);
  };

  // Handle listening state changes
  const handleSpeechToggle = (info) => {
    console.log('Listening:', info.isListening);
  };

  return (
    <SpeechToText 
      onSpeech={handleSpeech}
      onSpeechToggle={handleSpeechToggle}
      silenceDuration={1000}
      maxSilenceDuration={60000}
      countdownThreshold={10000}
      language="en-US"
    >
      {({ 
        listening, 
        isActivelySpeaking, 
        silenceCountdown, 
        transcript, 
        interimTranscript,
        toggleListening 
      }) => (
        <div>
          <button onClick={toggleListening}>
            {listening ? 'Stop Listening' : 'Start Listening'}
          </button>
          
          <div>
            {listening
              ? isActivelySpeaking
                ? 'Active Speech Detected'
                : silenceCountdown
                  ? `No Speech Detected (${silenceCountdown}s)`
                  : 'Waiting for Speech'
              : 'Paused'
            }
          </div>
          
          <div>
            <h3>Transcript:</h3>
            <p>{transcript}</p>
          </div>
        </div>
      )}
    </SpeechToText>
  );
};
```

## Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `onSpeech` | Function | Callback triggered when speech is detected | - |
| `onSpeechToggle` | Function | Callback triggered when recognition is toggled | - |
| `children` | ReactNode or Function | Either React elements or a render function that receives component state | - |
| `silenceDuration` | number | Duration of silence (ms) before pausing active speaking state | 1000 |
| `maxSilenceDuration` | number | Maximum allowed silence duration (ms) before stopping | 60000 |
| `countdownThreshold` | number | When to start showing countdown (ms) | 10000 |
| `language` | string | Speech recognition language | 'en-US' |

## Callback Information

### onSpeech callback

Receives an object with:

```ts
{
  transcript: string;       // The complete transcription 
  interimTranscript: string; // In-progress transcription
  resetTranscript: () => string | null; // Function to reset transcript and return previous value
}
```

### onSpeechToggle callback

Receives an object with:

```ts
{
  isListening: boolean;     // Whether speech recognition is active
  type: 'device';           // The type of toggling (always 'device' for now)
}
```

## State Object (available in render props)

| Property | Type | Description |
|----------|------|-------------|
| `listening` | boolean | Whether speech recognition is active |
| `isActivelySpeaking` | boolean | Whether user is actively speaking (resets after silence) |
| `silenceCountdown` | number | Countdown before auto-stopping (null when not counting down) |
| `transcript` | string | Current transcript text |
| `interimTranscript` | string | Interim (in-progress) transcript text |
| `browserSupportsSpeechRecognition` | boolean | Whether browser supports speech recognition |
| `resetTranscript` | function | Reset the transcript |
| `startListening` | function | Start speech recognition |
| `stopListening` | function | Stop speech recognition |
| `toggleListening` | function | Toggle speech recognition on/off |

## Browser Support

This component uses the Web Speech API, which is supported in most modern browsers. Check [browser compatibility](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition#browser_compatibility) for details.

## License

MIT