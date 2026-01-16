import { useState, useEffect, useCallback } from 'react';
import { scenariosApi } from '@/lib/api';
import { ScenarioListItem, Scenario } from '@/types';

interface UseScenariosParams {
  page?: number;
  pageSize?: number;
  category?: string;
  difficulty?: string;
  search?: string;
}

/**
 * Hook for fetching scenarios list
 * Supports pagination, filtering by category/difficulty, and search
 */
export function useScenarios(params: UseScenariosParams = {}) {
  const [data, setData] = useState<ScenarioListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await scenariosApi.getAll(params);
      if (response.success && response.data) {
        setData(response.data.items);
        setTotal(response.data.total);
      } else {
        setError(response.message || 'Failed to fetch scenarios');
      }
    } catch (err) {
      console.warn('Using fallback scenarios data:', err);
      // Fallback mock data for demo
      setData([
        {
          id: '1',
          title: 'Cloud Migration Discussion',
          description: 'Discuss cloud migration options with a CTO who is currently using AWS.',
          difficulty: 'medium',
          category: 'Technical Solution',
          estimatedDuration: 15,
          practiceCount: 234,
          averageScore: 72.5,
          buyerPersona: {
            name: 'Michael Li',
            role: 'CTO',
            company: 'FinTech Innovations Inc.',
          },
        },
        {
          id: '2',
          title: 'Price Objection Handling',
          description: 'Handle price objections from a procurement manager.',
          difficulty: 'hard',
          category: 'Objection Handling',
          estimatedDuration: 12,
          practiceCount: 189,
          averageScore: 68.3,
          buyerPersona: {
            name: 'Sarah Chen',
            role: 'Procurement Manager',
            company: 'Global Manufacturing Corp.',
          },
        },
        {
          id: '3',
          title: 'Data Security Compliance',
          description: 'Address security and compliance questions from a healthcare company.',
          difficulty: 'medium',
          category: 'Compliance',
          estimatedDuration: 15,
          practiceCount: 156,
          averageScore: 75.1,
          buyerPersona: {
            name: 'Dr. Jennifer Wong',
            role: 'Chief Compliance Officer',
            company: 'HealthFirst Medical Group',
          },
        },
      ]);
      setTotal(3);
    } finally {
      setIsLoading(false);
    }
  }, [params.page, params.pageSize, params.category, params.difficulty, params.search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, total, isLoading, error, refetch: fetchData };
}

/**
 * Hook for fetching a single scenario by ID
 */
export function useScenario(id: string) {
  const [data, setData] = useState<Scenario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await scenariosApi.getById(id);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.message || 'Failed to fetch scenario');
      }
    } catch (err) {
      console.warn('Using fallback scenario data:', err);
      // Fallback mock data for demo
      setData({
        id: id,
        title: 'Cloud Migration Discussion',
        description: 'Discuss cloud migration options with a CTO who is currently using AWS.',
        buyerPersona: {
          name: 'Michael Li',
          role: 'CTO',
          company: 'FinTech Innovations Inc.',
          background: '15 years IT experience, currently using AWS for 3 years.',
          concerns: ['Data compliance', 'Migration cost', 'Technical support'],
          personality: 'Direct, data-driven, skeptical of new solutions.',
        },
        objections: ['Security concerns', 'Migration complexity'],
        idealResponses: ['Highlight compliance certifications', 'Explain migration support'],
        difficulty: 'medium',
        category: 'Technical Solution',
        isActive: true,
        estimatedDuration: 15,
        practiceCount: 234,
        averageScore: 72.5,
        createdBy: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

/**
 * Hook for fetching recommended scenarios
 */
export function useRecommendedScenarios() {
  const [data, setData] = useState<ScenarioListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await scenariosApi.getRecommended();
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.message || 'Failed to fetch recommended scenarios');
      }
    } catch (err) {
      console.warn('Using fallback recommended scenarios:', err);
      // Fallback mock data
      setData([
        {
          id: '1',
          title: 'Price Objection Handling',
          description: 'Learn to handle pricing concerns and demonstrate value',
          difficulty: 'hard',
          category: 'Objections',
          estimatedDuration: 12,
          practiceCount: 189,
          averageScore: 68.3,
          buyerPersona: { name: 'Sarah Chen', role: 'Procurement Manager', company: 'Corp.' },
        },
        {
          id: '2',
          title: 'Data Security Compliance',
          description: 'Address security and compliance questions effectively',
          difficulty: 'medium',
          category: 'Compliance',
          estimatedDuration: 15,
          practiceCount: 156,
          averageScore: 75.1,
          buyerPersona: { name: 'Dr. Wong', role: 'CCO', company: 'HealthFirst' },
        },
        {
          id: '3',
          title: 'Cloud Migration Discussion',
          description: 'Guide customers through cloud migration decisions',
          difficulty: 'medium',
          category: 'Technical',
          estimatedDuration: 15,
          practiceCount: 234,
          averageScore: 72.5,
          buyerPersona: { name: 'Michael Li', role: 'CTO', company: 'FinTech' },
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

