import React, { useState, useEffect, useRef, useCallback } from 'react';

// Check if the browser supports the SpeechRecognition API
const SpeechRecognition = window.SpeechRecognition || (window).webkitSpeechRecognition;

const VoiceSearch: React.FC = () => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [transcript, setTranscript] = useState<string>('');
  const [lastSpokenTime, setLastSpokenTime] = useState<number | null>(null);
  const [tryAgainVisible, setTryAgainVisible] = useState<boolean>(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const currentTranscript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join('');

        setTranscript(currentTranscript);
        setLastSpokenTime(Date.now());
      };

      recognition.onerror = (event) => {
        console.error('Speech Recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      alert('SpeechRecognition API is not supported in this browser.');
    }
  }, []);

  const handleStartListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsListening(true);
      setLastSpokenTime(Date.now());
      setTryAgainVisible(false);
    }
  };

  const handleStopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      setTryAgainVisible(true);
    }
  };

  const handleSearch = useCallback(() => {
    setSearchTerm(transcript);
    handleStopListening();
  }, [transcript]);

  const handleClear = () => {
    setSearchTerm('');
    setTranscript('');
  };

  const handleGoogleSearch = () => {
    const query = encodeURIComponent(searchTerm);
    if (query) {
      window.open(`https://www.google.com/search?q=${query}`, '_blank');
    }
  };

  // Check if the user stops speaking for more than 5 seconds
  useEffect(() => {
    if (isListening && transcript && lastSpokenTime) {
      const timeSinceLastSpoken = Date.now() - lastSpokenTime;

      if (timeSinceLastSpoken > 2000) {
        handleSearch();
      } else {
        clearTimeout(timeoutRef.current as ReturnType<typeof setTimeout>);
        timeoutRef.current = setTimeout(() => {
          handleSearch();
        }, 2000);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [transcript, lastSpokenTime, isListening, handleSearch]);

  // Automatically stop listening after 5 seconds of silence
  useEffect(() => {
    const stopTimeout = setTimeout(() => {
      if (isListening && lastSpokenTime && Date.now() - lastSpokenTime > 5000) {
        handleStopListening();
      }
    }, 2000);

    return () => clearTimeout(stopTimeout);
  }, [lastSpokenTime, isListening]);

  return (
    <div>
      <h2>Voice Recognition Search</h2>
      <input
        type="text"
        value={searchTerm}
        placeholder="Speak or type search"
        onChange={(e) => setSearchTerm(e.target.value)}
        readOnly={isListening} // Make the input editable after listening stops
      />
      <br />
      <button onClick={handleStartListening} disabled={isListening}>
        {isListening ? 'Listening...' : 'Start Listening'}
      </button>
      <button onClick={handleStopListening} disabled={!isListening}>
        Stop
      </button>
      {tryAgainVisible && (
        <button onClick={() => handleStartListening()}>
          Try Again
        </button>
      )}
      <br />
      <button onClick={handleClear} disabled={!searchTerm}>
        Clear
      </button>
      <br />
      <button onClick={handleGoogleSearch} disabled={!searchTerm}>
        Search on Google
      </button>

      <p>
        ( Instruction :-- Click 'Start Listening' and speak your search. The term will appear in the input box. If needed, you can manually edit it before clicking 'Search on Google' to see the results. )
      </p>
    </div>
  );
};

export default VoiceSearch;
