// hooks/useCustomSpeechRecognition.ts
import { useState, useEffect, useRef, useCallback } from 'react';

export const useCustomSpeechRecognition = () => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false); // NEW: Track starting state for component
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');
  const isStartingRef = useRef(false);
  const restartTimeoutRef = useRef<NodeJS.Timeout>();
  const noSpeechTimeoutRef = useRef<NodeJS.Timeout>();
  const manualStopRef = useRef(false);
  const isProcessingRef = useRef(false); // NEW: Track if we're processing start/stop

  useEffect(() => {
    // Check browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    
    try {
      recognitionRef.current = new SpeechRecognition();
    } catch (err) {
      setError('Failed to initialize speech recognition');
      return;
    }

    // Configuration - IMPORTANT: Set longer timeouts
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.maxAlternatives = 1;

    // Event handlers
    recognitionRef.current.onstart = () => {
      console.log('Speech recognition started');
      setIsListening(true);
      setIsStarting(false); // NEW: Reset starting state
      setError(null);
      isStartingRef.current = false;
      isProcessingRef.current = false;
      manualStopRef.current = false;
      
      // Clear any existing restart timeouts
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      
      // Set up no-speech timeout (restart after 15 seconds of no speech) - INCREASED
      if (noSpeechTimeoutRef.current) {
        clearTimeout(noSpeechTimeoutRef.current);
      }
      noSpeechTimeoutRef.current = setTimeout(() => {
        if (isListening && !manualStopRef.current) {
          console.log('No speech detected for 15 seconds, restarting recognition...');
          restartRecognition();
        }
      }, 15000); // Increased to 15 seconds
    };

    recognitionRef.current.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart + ' ';
        } else {
          interimTranscript += transcriptPart;
        }
      }

      // Update final transcript
      if (finalTranscript) {
        finalTranscriptRef.current += finalTranscript;
        setTranscript(finalTranscriptRef.current.trim());
        console.log('Final transcript:', finalTranscript);
        
        // Reset no-speech timeout when we get results
        if (noSpeechTimeoutRef.current) {
          clearTimeout(noSpeechTimeoutRef.current);
        }
        noSpeechTimeoutRef.current = setTimeout(() => {
          if (isListening && !manualStopRef.current) {
            console.log('No speech detected after final result, restarting recognition...');
            restartRecognition();
          }
        }, 15000); // Increased to 15 seconds
      }

      // You can also use interimTranscript for real-time feedback if needed
      if (interimTranscript) {
        console.log('Interim transcript:', interimTranscript);
        
        // Reset no-speech timeout when we get interim results
        if (noSpeechTimeoutRef.current) {
          clearTimeout(noSpeechTimeoutRef.current);
        }
        noSpeechTimeoutRef.current = setTimeout(() => {
          if (isListening && !manualStopRef.current) {
            console.log('No speech detected after interim result, restarting recognition...');
            restartRecognition();
          }
        }, 15000); // Increased to 15 seconds
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      
      // Handle specific errors
      switch (event.error) {
        case 'no-speech':
          // This is common during pauses, not a critical error
          console.log('No speech detected (normal during pauses)');
          // Auto-restart after a brief delay only if not manually stopped
          if (isListening && !manualStopRef.current) {
            console.log('Auto-restarting after no-speech error...');
            restartTimeoutRef.current = setTimeout(() => {
              if (!manualStopRef.current) {
                restartRecognition();
              }
            }, 2000); // Increased delay
          }
          break;
        case 'audio-capture':
          setError('No microphone found. Please check your microphone connection.');
          break;
        case 'not-allowed':
          setError('Microphone permission denied. Please allow microphone access.');
          break;
        case 'network':
          setError('Network error occurred during speech recognition.');
          break;
        case 'aborted':
          console.log('Speech recognition aborted (may be normal)');
          // Auto-restart if we're supposed to be listening and not manually stopped
          if (isListening && !manualStopRef.current) {
            console.log('Auto-restarting after aborted error...');
            restartTimeoutRef.current = setTimeout(() => {
              if (!manualStopRef.current) {
                restartRecognition();
              }
            }, 2000); // Increased delay
          }
          break;
        default:
          setError(`Speech recognition error: ${event.error}`);
      }
      
      setIsListening(false);
      setIsStarting(false);
      isStartingRef.current = false;
      isProcessingRef.current = false;
    };

    // FIXED: Production-ready onend handler
    recognitionRef.current.onend = () => {
      console.log('Speech recognition ended');
      setIsListening(false);
      setIsStarting(false);
      isStartingRef.current = false;
      isProcessingRef.current = false;
      
      // Only auto-restart if it wasn't a manual stop
      if (!manualStopRef.current) {
        console.log('Auto-restarting after unexpected end...');
        restartTimeoutRef.current = setTimeout(() => {
          if (!isStartingRef.current && !manualStopRef.current && !isProcessingRef.current) {
            restartRecognition();
          }
        }, 1000); // Increased delay for stability
      } else {
        // Reset manual stop flag
        manualStopRef.current = false;
      }
    };

    // Cleanup
    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (noSpeechTimeoutRef.current) {
        clearTimeout(noSpeechTimeoutRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          // Ignore errors during cleanup
        }
      }
    };
  }, []);

  const restartRecognition = useCallback(async (): Promise<boolean> => {
    if (!recognitionRef.current || isProcessingRef.current) {
      return false;
    }

    try {
      console.log('Restarting speech recognition...');
      isProcessingRef.current = true;
      
      // Stop current recognition
      if (isListening) {
        recognitionRef.current.stop();
        await new Promise(resolve => setTimeout(resolve, 500)); // Increased delay
      }
      
      // Clear timeouts
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      
      // Start again
      await recognitionRef.current.start();
      return true;
    } catch (error) {
      console.error('Error restarting speech recognition:', error);
      return false;
    } finally {
      isProcessingRef.current = false;
    }
  }, [isListening]);

  // FIXED: Production-ready startListening function
  const startListening = useCallback(async (): Promise<boolean> => {
    if (!recognitionRef.current) {
      setError('Speech recognition not initialized');
      return false;
    }

    if (isProcessingRef.current || isStartingRef.current) {
      console.log('Already processing start recognition request');
      return false;
    }

    try {
      isProcessingRef.current = true;
      isStartingRef.current = true;
      setIsStarting(true); // NEW: Update component state
      manualStopRef.current = false;
      setError(null);
      
      // Reset transcript for new session
      finalTranscriptRef.current = '';
      setTranscript('');
      
      // Clear any existing timeouts
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (noSpeechTimeoutRef.current) {
        clearTimeout(noSpeechTimeoutRef.current);
      }
      
      await recognitionRef.current.start();
      return true;
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setError('Failed to start speech recognition');
      isStartingRef.current = false;
      setIsStarting(false); // NEW: Reset component state
      isProcessingRef.current = false;
      return false;
    }
  }, []);

  // FIXED: Production-ready stopListening function
  const stopListening = useCallback(async (): Promise<boolean> => {
    if (!recognitionRef.current) {
      return false;
    }

    if (isProcessingRef.current) {
      console.log('Already processing stop recognition request');
      return false;
    }

    try {
      isProcessingRef.current = true;
      // Set flag to prevent auto-restart
      isStartingRef.current = true;
      manualStopRef.current = true;
      
      // Clear all timeouts
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (noSpeechTimeoutRef.current) {
        clearTimeout(noSpeechTimeoutRef.current);
      }
      
      recognitionRef.current.stop();
      return true;
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
      return false;
    } finally {
      isProcessingRef.current = false;
    }
  }, []);

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = '';
    setTranscript('');
  }, []);

  const getCurrentTranscript = useCallback(() => {
    return finalTranscriptRef.current;
  }, []);

  return {
    transcript,
    isListening,
    error,
    startListening,
    stopListening,
    resetTranscript,
    getCurrentTranscript,
    restartRecognition,
    isStarting, // NEW: Export starting state
  };
};