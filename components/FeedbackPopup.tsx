'use client';

import { useState, useEffect } from 'react';
import { X, Star } from 'lucide-react';

interface FeedbackPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function FeedbackPopup({ isOpen, onClose, onSubmit }: FeedbackPopupProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [experience, setExperience] = useState('');
  const [wantsToSee, setWantsToSee] = useState('');

  useEffect(() => {
    // Check if user has already submitted feedback this week
    const lastFeedback = localStorage.getItem('lastFeedbackDate');
    if (lastFeedback) {
      const lastDate = new Date(lastFeedback);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 7) {
        onClose();
      }
    }
  }, [onClose]);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Please provide a rating');
      return;
    }

    try {
      await onSubmit({
        rating,
        comment,
        experience,
        wantsToSee
      });

      // Store submission date
      localStorage.setItem('lastFeedbackDate', new Date().toISOString());
      
      onClose();
      setRating(0);
      setComment('');
      setExperience('');
      setWantsToSee('');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Share Your Feedback</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">How would you rate your experience?</label>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`p-1 ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
              >
                <Star size={28} fill={rating >= star ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">How was your overall experience?</label>
          <select
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">Select your experience</option>
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Neutral">Neutral</option>
            <option value="Poor">Poor</option>
            <option value="Terrible">Terrible</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">What features would you like to see?</label>
          <textarea
            value={wantsToSee}
            onChange={(e) => setWantsToSee(e.target.value)}
            placeholder="Tell us what features you'd like us to add..."
            className="w-full p-2 border border-gray-300 rounded-md h-20"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Additional comments</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Any other feedback or suggestions..."
            className="w-full p-2 border border-gray-300 rounded-md h-20"
          />
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Submit Feedback
          </button>
        </div>
      </div>
    </div>
  );
}