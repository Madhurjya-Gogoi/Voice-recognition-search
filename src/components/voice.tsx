import React, { useState, useEffect, useRef, useCallback } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

const VoiceSearch: React.FC = () => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [lastSpokenTime, setLastSpokenTime] = useState<number | null>(null);
  const [tryAgainVisible, setTryAgainVisible] = useState<boolean>(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
console.log(isListening)
  const { transcript, resetTranscript, listening } = useSpeechRecognition();

  const handleStartListening = () => {
    setIsListening(true);
    SpeechRecognition.startListening({ continuous: true });
    setLastSpokenTime(Date.now());
    setTryAgainVisible(false);
  };

  const handleStopListening = () => {
    setIsListening(false);
    SpeechRecognition.stopListening();
    setTryAgainVisible(true); // Show try again button
  };

  const handleSearch = useCallback(() => {
    setSearchTerm(transcript);
    handleStopListening();
    console.log('Search term:', transcript);
  },[transcript]);

  const handleClear = () => {
    setSearchTerm('');
    resetTranscript();
  };

  const handleGoogleSearch = () => {
    const query = encodeURIComponent(searchTerm);
    if (query) {
      window.open(`https://www.google.com/search?q=${query}`, '_blank');
    }
  };

  // Check if the user stops speaking for more than 5 seconds
  useEffect(() => {
    if (listening && transcript && lastSpokenTime) {
      const timeSinceLastSpoken = Date.now() - lastSpokenTime;

      if (timeSinceLastSpoken > 5000) {
        handleSearch();
      } else {
        clearTimeout(timeoutRef.current as ReturnType<typeof setTimeout>);
        timeoutRef.current = setTimeout(() => {
          handleSearch();
        }, 5000);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [transcript, lastSpokenTime, listening, handleSearch]);

  // If user stops speaking for 5 seconds, stop listening
  useEffect(() => {
    const stopTimeout = setTimeout(() => {
      if (listening && lastSpokenTime && Date.now() - lastSpokenTime > 5000) {
        handleStopListening();
      }
    }, 5000);

    return () => clearTimeout(stopTimeout);
  }, [lastSpokenTime, listening]);

  // Update last spoken time whenever transcript changes
  useEffect(() => {
    if (transcript) {
      setLastSpokenTime(Date.now());
    }
  }, [transcript]);

  return (
    <div>
      <h2>Voice Recognition Search</h2>
      <input
        type="text"
        value={searchTerm}
        placeholder="Speak or type search"
        onChange={(e) => setSearchTerm(e.target.value)}
        readOnly={listening} // Make the input editable after listening stops
      />
      <br />
      <button onClick={handleStartListening} disabled={listening}>
        {listening ? 'Listening...' : 'Start Listening'}
      </button>
      <button onClick={handleStopListening} disabled={!listening}>
        Stop
      </button>
      {tryAgainVisible && (
        <button onClick={() =>  handleStartListening()}>
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


      <p>( Instruction :-- Click 'Start Listening' and speak your search. The term will appear in the input box. If needed, you can manually edit it before clicking 'Search on Google' to see the results. )</p>
    </div>
  );
};

export default VoiceSearch;
