import { useState, useEffect, useCallback } from 'react';
import { statisticsApi } from '@/lib/api';
import { UserStatistics, AdminStatistics } from '@/types';

/**
 * Hook for fetching user statistics
 * Provides user-level practice data and score history
 */
export function useUserStatistics() {
  const [data, setData] = useState<UserStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await statisticsApi.getUserStats();
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.message || 'Failed to fetch statistics');
      }
    } catch (err) {
      // If API fails, use fallback data for demo purposes
      console.warn('Using fallback statistics data:', err);
      setData({
        totalPractices: 0,
        averageScore: 0,
        totalDuration: 0,
        bestScore: 0,
        thisWeekPractices: 0,
        thisWeekTarget: 5,
        scoreHistory: [],
        scoreByScenario: [],
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

/**
 * Hook for fetching admin statistics
 * Provides system-wide analytics and metrics
 */
export function useAdminStatistics() {
  const [data, setData] = useState<AdminStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await statisticsApi.getAdminStats();
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.message || 'Failed to fetch admin statistics');
      }
    } catch (err) {
      // If API fails, use fallback data for demo purposes
      console.warn('Using fallback admin statistics data:', err);
      setData({
        activeUsersToday: 0,
        sessionsToday: 0,
        activeScenarios: 0,
        averageScore: 0,
        userGrowth: 0,
        sessionGrowth: 0,
        practicesTrend: [],
        scoreDistribution: [],
        topScenarios: [],
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

