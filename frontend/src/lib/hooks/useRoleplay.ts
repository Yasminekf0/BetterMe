import { useState, useCallback } from 'react';
import { roleplayApi, feedbackApi, emailApi } from '@/lib/api';
import { Session, Message, Feedback, FollowUpEmail } from '@/types';

/**
 * Hook for managing roleplay sessions
 * Handles session creation, messaging, and completion
 */
export function useRoleplay() {
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start a new roleplay session
  const startSession = useCallback(async (scenarioId: string): Promise<Session | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await roleplayApi.start(scenarioId);
      if (response.success && response.data) {
        setSession(response.data);
        setMessages(response.data.messages || []);
        return response.data;
      } else {
        setError(response.message || 'Failed to start session');
        return null;
      }
    } catch (err) {
      console.error('Failed to start session:', err);
      // Create fallback session for demo
      const fallbackSession: Session = {
        id: `session-${Date.now()}`,
        userId: 'demo-user',
        scenarioId,
        status: 'active',
        messages: [
          {
            id: '1',
            sessionId: `session-${Date.now()}`,
            role: 'ai',
            content: "Hello, I'm Michael Li, CTO at FinTech Innovations. I've heard you have some cloud solutions to discuss. We're currently using AWS and I'm evaluating alternatives. What makes your solution worth considering?",
            timestamp: new Date().toISOString(),
          },
        ],
        startedAt: new Date().toISOString(),
      };
      setSession(fallbackSession);
      setMessages(fallbackSession.messages);
      return fallbackSession;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Send a message in the roleplay
  const sendMessage = useCallback(async (content: string): Promise<Message | null> => {
    if (!session) {
      setError('No active session');
      return null;
    }
    setIsSending(true);
    setError(null);
    // Optimistically add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      sessionId: session.id,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    try {
      const response = await roleplayApi.sendMessage(session.id, content);
      if (response.success && response.data) {
        const { aiMessage } = response.data;
        setMessages((prev) => [...prev, aiMessage]);
        return aiMessage;
      } else {
        setError(response.message || 'Failed to send message');
        return null;
      }
    } catch (err) {
      console.error('Failed to send message, using fallback:', err);
      // Generate fallback AI response
      const aiResponses = [
        "I appreciate the enthusiasm, but let me push back a bit. What specific advantages do you have over AWS in the APAC region?",
        "Interesting. But switching providers is a major undertaking. What kind of migration support do you offer?",
        "The technical points are valid, but I need to think about ROI. Can you walk me through a realistic cost comparison?",
        "I hear what you're saying about support. Can you share specific SLA guarantees?",
      ];
      const userMsgCount = messages.filter(m => m.role === 'user').length;
      const aiMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        sessionId: session.id,
        role: 'ai',
        content: aiResponses[Math.min(userMsgCount, aiResponses.length - 1)],
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      return aiMessage;
    } finally {
      setIsSending(false);
    }
  }, [session, messages]);

  // End the roleplay session
  const endSession = useCallback(async (): Promise<Session | null> => {
    if (!session) {
      setError('No active session');
      return null;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await roleplayApi.end(session.id);
      if (response.success && response.data) {
        setSession(response.data);
        return response.data;
      } else {
        setError(response.message || 'Failed to end session');
        return null;
      }
    } catch (err) {
      console.error('Failed to end session:', err);
      // Return current session as completed
      const completedSession = { ...session, status: 'completed' as const };
      setSession(completedSession);
      return completedSession;
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  // Load existing session
  const loadSession = useCallback(async (sessionId: string): Promise<Session | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await roleplayApi.getSession(sessionId);
      if (response.success && response.data) {
        setSession(response.data);
        setMessages(response.data.messages || []);
        return response.data;
      } else {
        setError(response.message || 'Failed to load session');
        return null;
      }
    } catch (err) {
      console.error('Failed to load session:', err);
      setError('Failed to load session');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reset the hook state
  const reset = useCallback(() => {
    setSession(null);
    setMessages([]);
    setError(null);
  }, []);

  return {
    session,
    messages,
    isLoading,
    isSending,
    error,
    startSession,
    sendMessage,
    endSession,
    loadSession,
    reset,
  };
}

/**
 * Hook for managing feedback
 */
export function useFeedback(sessionId: string) {
  const [data, setData] = useState<Feedback | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing feedback
  const fetchFeedback = useCallback(async () => {
    if (!sessionId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await feedbackApi.getBySession(sessionId);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        // Feedback not found, might need to generate
        setData(null);
      }
    } catch (err) {
      console.warn('Using fallback feedback data:', err);
      // Fallback mock feedback
      setData({
        id: '1',
        sessionId,
        overallScore: 78,
        dimensions: [
          {
            name: 'Value Articulation',
            score: 80,
            weight: 35,
            quote: 'Alibaba Cloud has the most data centers in Asia-Pacific.',
            explanation: 'You effectively highlighted geographic advantages.',
            suggestions: ['Add specific uptime SLA percentages', 'Mention differentiation from AWS'],
          },
          {
            name: 'Objection Handling',
            score: 75,
            weight: 35,
            quote: 'The migration follows a phased approach.',
            explanation: 'You addressed the migration concern adequately.',
            suggestions: ['Provide specific migration timeline estimates', 'Mention dedicated migration team'],
          },
          {
            name: 'Technical Clarity',
            score: 78,
            weight: 30,
            quote: 'We provide 24/7 support with 15-minute response time.',
            explanation: 'Technical explanations were generally clear.',
            suggestions: ['Discuss specific technical architectures', 'Mention security certifications'],
          },
        ],
        summary: 'Overall, you demonstrated strong knowledge of the product.',
        recommendations: [
          'Practice providing specific numbers and statistics',
          'Prepare detailed migration case studies',
          'Develop a stronger differentiation story against AWS',
        ],
        createdAt: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Generate new feedback
  const generateFeedback = useCallback(async (): Promise<Feedback | null> => {
    if (!sessionId) return null;
    setIsGenerating(true);
    setError(null);
    try {
      const response = await feedbackApi.generate(sessionId);
      if (response.success && response.data) {
        setData(response.data);
        return response.data;
      } else {
        setError(response.message || 'Failed to generate feedback');
        return null;
      }
    } catch (err) {
      console.error('Failed to generate feedback:', err);
      setError('Failed to generate feedback');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [sessionId]);

  return {
    data,
    isLoading,
    isGenerating,
    error,
    fetchFeedback,
    generateFeedback,
  };
}

/**
 * Hook for managing follow-up emails
 */
export function useFollowUpEmail(sessionId: string) {
  const [data, setData] = useState<FollowUpEmail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing email
  const fetchEmail = useCallback(async () => {
    if (!sessionId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await emailApi.getBySession(sessionId);
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setData(null);
      }
    } catch (err) {
      console.warn('Using fallback email data:', err);
      // Fallback mock email
      setData({
        id: '1',
        sessionId,
        userId: 'demo-user',
        to: 'michael.li@company.com',
        subject: 'Follow-up: Cloud Solutions Discussion',
        body: `Dear Michael,

Thank you for taking the time to discuss your cloud infrastructure needs today.

Based on our conversation, I wanted to highlight a few key points:

1. Regional Coverage: We have 25+ data centers across Asia-Pacific, providing low latency for your regional offices.

2. Compliance & Security: We are fully certified for PCI DSS, ISO 27001, and China's Level 3 Data Protection requirements.

3. Migration Support: We offer a dedicated migration team with a phased approach to ensure business continuity.

I would love to schedule a technical deep-dive session. Would next Tuesday or Wednesday work?

Best regards,
Demo User`,
        isEdited: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Generate new email
  const generateEmail = useCallback(async (): Promise<FollowUpEmail | null> => {
    if (!sessionId) return null;
    setIsGenerating(true);
    setError(null);
    try {
      const response = await emailApi.generate(sessionId);
      if (response.success && response.data) {
        setData(response.data);
        return response.data;
      } else {
        setError(response.message || 'Failed to generate email');
        return null;
      }
    } catch (err) {
      console.error('Failed to generate email:', err);
      setError('Failed to generate email');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [sessionId]);

  // Update email
  const updateEmail = useCallback(async (updates: Partial<FollowUpEmail>): Promise<FollowUpEmail | null> => {
    if (!data) return null;
    setIsSaving(true);
    setError(null);
    try {
      const response = await emailApi.update(data.id, updates);
      if (response.success && response.data) {
        setData(response.data);
        return response.data;
      } else {
        setError(response.message || 'Failed to update email');
        return null;
      }
    } catch (err) {
      console.error('Failed to update email:', err);
      // Update locally for demo
      const updatedEmail = { ...data, ...updates, isEdited: true, updatedAt: new Date().toISOString() };
      setData(updatedEmail);
      return updatedEmail;
    } finally {
      setIsSaving(false);
    }
  }, [data]);

  return {
    data,
    isLoading,
    isGenerating,
    isSaving,
    error,
    fetchEmail,
    generateEmail,
    updateEmail,
  };
}

