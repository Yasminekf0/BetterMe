'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Send, 
  HelpCircle, 
  User, 
  Bot,
  Lightbulb,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { useToast } from '@/components/ui/Toast';
import { ROUTES, MAX_DIALOGUE_TURNS, MESSAGE_MIN_LENGTH, MESSAGE_MAX_LENGTH } from '@/lib/constants';
import { cn, formatTime } from '@/lib/utils';
import { useRoleplay } from '@/lib/hooks';
import { useScenario } from '@/lib/hooks';

export default function RoleplayPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  const sessionId = params.sessionId as string;
  const { data: scenario } = useScenario(sessionId);
  
  const {
    session,
    messages,
    isLoading: isSessionLoading,
    isSending,
    error: sessionError,
    loadSession,
    sendMessage,
    endSession,
  } = useRoleplay();

  const [inputValue, setInputValue] = React.useState('');
  const [isEnding, setIsEnding] = React.useState(false);
  const [showEndConfirm, setShowEndConfirm] = React.useState(false);
  const [validationError, setValidationError] = React.useState<string | null>(null);

  // Calculate turn counts
  const userMessageCount = messages.filter(m => m.role === 'user').length;
  const maxTurns = session?.scenario?.estimatedDuration ? 8 : MAX_DIALOGUE_TURNS;
  const turnsRemaining = maxTurns - userMessageCount;
  const canSendMessage = turnsRemaining > 0 && !isSending;

  // Load session on mount
  React.useEffect(() => {
    if (sessionId && sessionId !== 'demo-session-id') {
      loadSession(sessionId);
    }
  }, [sessionId, loadSession]);

  // Auto scroll to bottom when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Show error toast
  React.useEffect(() => {
    if (sessionError) {
      toast.error(sessionError);
    }
  }, [sessionError, toast]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !canSendMessage) return;

    const content = inputValue.trim();

    // Validate message length
    if (content.length < MESSAGE_MIN_LENGTH) {
      setValidationError(`Message must be at least ${MESSAGE_MIN_LENGTH} characters`);
      return;
    }
    if (content.length > MESSAGE_MAX_LENGTH) {
      setValidationError(`Message must not exceed ${MESSAGE_MAX_LENGTH} characters`);
      return;
    }

    setValidationError(null);
    setInputValue('');
    
    const response = await sendMessage(content);
    if (response) {
      // Check if max turns reached
      if (userMessageCount + 1 >= maxTurns) {
        toast.info('Maximum turns reached. Click "End Chat" to get your feedback.');
      }
    }
  };

  const handleEndSession = async () => {
    setIsEnding(true);
    const completedSession = await endSession();
    
    if (completedSession) {
      toast.success('Session completed! Generating feedback...');
      router.push(ROUTES.FEEDBACK(sessionId));
    } else {
      setIsEnding(false);
      toast.error('Failed to end session. Please try again.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Session info for display
  const displaySession = {
    title: session?.scenario?.title || scenario?.title || 'Sales Roleplay',
    buyerPersona: session?.scenario?.buyerPersona || scenario?.buyerPersona || {
      name: 'AI Buyer',
      role: 'Decision Maker',
      company: 'Company',
      concerns: ['Security', 'Cost', 'Support'],
    },
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-4">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h1 className="font-semibold text-gray-900">{displaySession.title}</h1>
            <p className="text-sm text-gray-500">
              Turn {userMessageCount + 1} of {maxTurns}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" title="Help">
              <HelpCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEndConfirm(true)}
              className="text-error-600 hover:text-error-700 hover:bg-error-50"
            >
              End Chat
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !isSessionLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Bot className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Waiting for AI buyer to start the conversation...</p>
              </div>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3 message-enter',
                message.role === 'user' ? 'flex-row-reverse' : ''
              )}
            >
              {/* Avatar */}
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                message.role === 'user' 
                  ? 'bg-primary-100 text-primary-600'
                  : 'bg-gray-100 text-gray-600'
              )}>
                {message.role === 'user' ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>

              {/* Message Bubble */}
              <div className={cn(
                'max-w-[75%] rounded-2xl px-4 py-3',
                message.role === 'user'
                  ? 'bg-primary-500 text-white rounded-tr-sm'
                  : 'bg-gray-100 text-gray-900 rounded-tl-sm'
              )}>
                {message.role === 'ai' && (
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    {displaySession.buyerPersona.name}
                  </p>
                )}
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className={cn(
                  'text-xs mt-1',
                  message.role === 'user' ? 'text-primary-200' : 'text-gray-400'
                )}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isSending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <Bot className="h-4 w-4 text-gray-600" />
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="typing-indicator">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200">
          {validationError && (
            <div className="flex items-center gap-2 text-sm text-error-600 mb-2">
              <AlertCircle className="h-4 w-4" />
              {validationError}
            </div>
          )}
          
          {turnsRemaining <= 2 && turnsRemaining > 0 && (
            <div className="flex items-center gap-2 text-sm text-warning-600 mb-2">
              <AlertCircle className="h-4 w-4" />
              {turnsRemaining} turn{turnsRemaining !== 1 ? 's' : ''} remaining
            </div>
          )}

          {turnsRemaining <= 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-3">Maximum turns reached. End the session to get your feedback.</p>
              <Button onClick={() => setShowEndConfirm(true)}>
                End Session & Get Feedback
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your response..."
                disabled={!canSendMessage}
                className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
                rows={2}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || !canSendMessage}
                loading={isSending}
                className="self-end"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
            <span>{inputValue.length}/{MESSAGE_MAX_LENGTH}</span>
            <span>Press Enter to send, Shift+Enter for new line</span>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-full lg:w-80 space-y-4">
        {/* Buyer Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Buyer Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-xl font-bold text-primary-600">
                  {displaySession.buyerPersona.name.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{displaySession.buyerPersona.name}</p>
                <p className="text-sm text-gray-500">
                  {displaySession.buyerPersona.role}
                </p>
                <p className="text-xs text-gray-400">
                  {displaySession.buyerPersona.company}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Concerns</p>
              <div className="flex flex-wrap gap-1">
                {displaySession.buyerPersona.concerns.map((concern, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {concern}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress
              value={userMessageCount}
              max={maxTurns}
              showLabel
              labelFormat={(v, m) => `${v}/${m} turns`}
            />
          </CardContent>
        </Card>

        {/* Tips */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-warning-500" />
              Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2 text-sm">
              <span className="text-warning-500">💡</span>
              <span className="text-gray-600">
                Listen actively and address specific concerns
              </span>
            </div>
            <div className="flex gap-2 text-sm">
              <span className="text-warning-500">💡</span>
              <span className="text-gray-600">
                Use concrete examples and data points
              </span>
            </div>
            <div className="flex gap-2 text-sm">
              <span className="text-warning-500">💡</span>
              <span className="text-gray-600">
                Ask clarifying questions to understand needs
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* End Confirmation Modal */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-md animate-in">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-warning-100 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-6 w-6 text-warning-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  End this session?
                </h3>
                <p className="text-gray-500 mb-2">
                  Current progress: {userMessageCount}/{maxTurns} turns
                </p>
                <p className="text-sm text-gray-400 mb-6">
                  A feedback report will be generated based on your conversation.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowEndConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleEndSession}
                    loading={isEnding}
                  >
                    End & Get Feedback
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
