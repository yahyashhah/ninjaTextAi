// components/admin/FeedbackManagement.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

interface Feedback {
  id: string;
  rating: number;
  comment: string | null;
  experience: string | null;
  wantsToSee: string | null;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface FeedbackMetrics {
  summary: {
    averageRating: number;
    totalFeedback: number;
    timeframe: string;
  };
  experienceStats: Array<{ experience: string; _count: { id: number } }>;
  ratingDistribution: Array<{ rating: number; _count: { id: number } }>;
  recentFeedback: Feedback[];
  weeklyTrends: Array<{ week: string; count: number; averageRating: number }>;
}

export default function FeedbackManagement() {
  const [metrics, setMetrics] = useState<FeedbackMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('week');
  const { getToken } = useAuth();

  useEffect(() => {
    fetchFeedbackMetrics();
  }, [timeframe]);

  const fetchFeedbackMetrics = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`/api/admin/feedback?timeframe=${timeframe}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch feedback metrics');
      }

      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching feedback metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading feedback metrics...</div>;
  }

  return (
    <div>
      <div className="mb-4">
        <label className="mr-2">Timeframe:</label>
        <select 
          value={timeframe} 
          onChange={(e) => setTimeframe(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="day">Last Day</option>
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold">Average Rating</h3>
          <p className="text-2xl">
            {metrics?.summary.averageRating.toFixed(1) || '0.0'}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold">Total Feedback</h3>
          <p className="text-2xl">{metrics?.summary.totalFeedback || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold">Timeframe</h3>
          <p className="text-lg capitalize">{metrics?.summary.timeframe || 'week'}</p>
        </div>
      </div>

      {/* Recent Feedback Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <h3 className="font-semibold p-4 border-b">Recent Feedback</h3>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">User</th>
              <th className="px-6 py-3 text-left">Rating</th>
              <th className="px-6 py-3 text-left">Experience</th>
              <th className="px-6 py-3 text-left">Feature Requests</th>
              <th className="px-6 py-3 text-left">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {metrics?.recentFeedback.map((feedback) => (
              <tr key={feedback.id}>
                <td className="px-6 py-4">
                  {feedback.user.firstName} {feedback.user.lastName}
                  <br />
                  <span className="text-sm text-gray-500">{feedback.user.email}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <span className="mr-1">{feedback.rating}</span>
                    <span>⭐</span>
                  </div>
                </td>
                <td className="px-6 py-4">{feedback.experience}</td>
                <td className="px-6 py-4">{feedback.wantsToSee}</td>
                <td className="px-6 py-4">
                  {new Date(feedback.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Additional feedback analytics can be added here */}
    </div>
  );
}