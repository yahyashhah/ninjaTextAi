'use client';

import { useState } from 'react';
import { useFeedback } from '@/hooks/useFeedback';
import FeedbackPopup from './FeedbackPopup';

interface FeedbackWrapperProps {
  children: React.ReactNode;
  userId: string;
}

export default function FeedbackWrapper({ children, userId }: FeedbackWrapperProps) {
  const { showFeedback, setShowFeedback } = useFeedback();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitFeedback = async (feedbackData: any) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      console.log('Feedback submitted successfully');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {children}
      <FeedbackPopup
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        onSubmit={handleSubmitFeedback}
      />
    </>
  );
}