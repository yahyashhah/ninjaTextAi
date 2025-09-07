'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

export function useFeedback() {
  const [showFeedback, setShowFeedback] = useState(false);
  const { userId } = useAuth();

  useEffect(() => {
    if (!userId) return;

    const checkFeedbackStatus = () => {
      const lastFeedback = localStorage.getItem('lastFeedbackDate');
      const lastPrompt = localStorage.getItem('lastFeedbackPrompt');
      
      if (!lastFeedback) {
        // First time user, show after 1 week
        const accountCreation = localStorage.getItem('accountCreationDate');
        if (!accountCreation) {
          localStorage.setItem('accountCreationDate', new Date().toISOString());
          return;
        }
        
        const creationDate = new Date(accountCreation);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - creationDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 7 && (!lastPrompt || new Date(lastPrompt) < new Date(now.setDate(now.getDate() - 1)))) {
          setShowFeedback(true);
          localStorage.setItem('lastFeedbackPrompt', new Date().toISOString());
        }
      } else {
        // Returning user, show every week
        const lastDate = new Date(lastFeedback);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 7 && (!lastPrompt || new Date(lastPrompt) < new Date(now.setDate(now.getDate() - 1)))) {
          setShowFeedback(true);
          localStorage.setItem('lastFeedbackPrompt', new Date().toISOString());
        }
      }
    };

    // Check on initial load
    checkFeedbackStatus();

    // Check daily
    const interval = setInterval(checkFeedbackStatus, 24 * 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [userId]);

  return { showFeedback, setShowFeedback };
}