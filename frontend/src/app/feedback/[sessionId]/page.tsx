'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  MessageSquare, 
  Mail, 
  RotateCcw, 
  Target,
  CheckCircle,
  Lightbulb,
  Quote,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { ROUTES } from '@/lib/constants';
import { cn, getScoreColor, getScoreLabel } from '@/lib/utils';
import { useFeedback } from '@/lib/hooks';

export default function FeedbackPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const sessionId = params.sessionId as string;

  const { data: feedback, isLoading, fetchFeedback, isGenerating, generateFeedback } = useFeedback(sessionId);
  const [isGeneratingEmail, setIsGeneratingEmail] = React.useState(false);
  const [previousScore] = React.useState(75); // This would come from user history

  // Fetch feedback on mount
  React.useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const handleGenerateEmail = async () => {
    setIsGeneratingEmail(true);
    // Navigate to email page which will generate the email
    toast.success('Generating follow-up email...');
    setTimeout(() => {
      router.push(ROUTES.EMAIL(sessionId));
    }, 500);
  };

  const handleRetryGeneration = async () => {
    const result = await generateFeedback();
    if (result) {
      toast.success('Feedback generated successfully!');
    } else {
      toast.error('Failed to generate feedback. Please try again.');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-5xl space-y-6">
        <Skeleton className="h-6 w-48" />
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <Skeleton className="w-36 h-36 rounded-full" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-8 w-48" />
                <SkeletonText lines={3} />
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <SkeletonText lines={4} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // No feedback yet
  if (!feedback) {
    return (
      <div className="max-w-5xl space-y-6">
        <Link
          href={ROUTES.DASHBOARD}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>
        
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Target className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Feedback Available</h3>
            <p className="text-gray-500 mb-6">
              Feedback has not been generated for this session yet.
            </p>
            <Button onClick={handleRetryGeneration} loading={isGenerating}>
              Generate Feedback
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const scoreDiff = feedback.overallScore - previousScore;
  const scoreImproved = scoreDiff > 0;

  // Calculate score circle properties
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (feedback.overallScore / 100) * circumference;

  return (
    <div className="max-w-5xl space-y-6">
      {/* Back Button */}
      <Link
        href={ROUTES.DASHBOARD}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Dashboard</span>
      </Link>

      {/* Overall Score Card */}
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* Score Circle */}
            <div className="relative">
              <svg width="140" height="140" className="transform -rotate-90">
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="10"
                />
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke={feedback.overallScore >= 80 ? '#52C41A' : feedback.overallScore >= 60 ? '#FAAD14' : '#FF4D4F'}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - progress}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-gray-900">
                  {feedback.overallScore}
                </span>
                <span className="text-sm text-gray-500">/100</span>
              </div>
            </div>

            {/* Score Details */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Practice Evaluation
              </h1>
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
                <Badge variant={feedback.overallScore >= 80 ? 'success' : feedback.overallScore >= 60 ? 'warning' : 'error'}>
                  {getScoreLabel(feedback.overallScore)}
                </Badge>
                {scoreDiff !== 0 && (
                  <span className={cn(
                    'flex items-center gap-1 text-sm font-medium',
                    scoreImproved ? 'text-success-600' : 'text-error-600'
                  )}>
                    {scoreImproved ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {Math.abs(scoreDiff)} points vs last time
                  </span>
                )}
              </div>

              {/* Dimension Summary */}
              <div className="space-y-2">
                {feedback.dimensions.map((dim) => (
                  <div key={dim.name} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-40">{dim.name}</span>
                    <Progress value={dim.score} max={100} className="flex-1 h-2" />
                    <span className={cn(
                      'text-sm font-medium w-12 text-right',
                      getScoreColor(dim.score)
                    )}>
                      {dim.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Detailed Analysis</h2>
        
        {feedback.dimensions.map((dim, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  {dim.name}
                  <Badge variant="outline" className="font-normal">
                    {dim.weight}% weight
                  </Badge>
                </CardTitle>
                <span className={cn(
                  'text-xl font-bold',
                  getScoreColor(dim.score)
                )}>
                  {dim.score}/100
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quote */}
              <div className="flex gap-3 p-4 bg-gray-50 rounded-xl">
                <Quote className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700 italic">
                  &ldquo;{dim.quote}&rdquo;
                </p>
              </div>

              {/* Explanation */}
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-success-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Analysis</p>
                  <p className="text-sm text-gray-600">{dim.explanation}</p>
                </div>
              </div>

              {/* Suggestions */}
              {dim.suggestions && dim.suggestions.length > 0 && (
                <div className="flex gap-3">
                  <Lightbulb className="h-5 w-5 text-warning-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">Suggestions for Improvement</p>
                    <ul className="space-y-1">
                      {dim.suggestions.map((suggestion, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-gray-400">•</span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary & Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Summary & Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">{feedback.summary}</p>
          
          {feedback.recommendations && feedback.recommendations.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-900 mb-3">Key Recommendations</p>
              <ul className="space-y-2">
                {feedback.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary-600">{index + 1}</span>
                    </div>
                    <p className="text-sm text-gray-600 pt-0.5">{rec}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <Button
          variant="outline"
          leftIcon={<MessageSquare className="h-4 w-4" />}
          onClick={() => router.push(ROUTES.ROLEPLAY(sessionId))}
        >
          View Transcript
        </Button>
        <Button
          leftIcon={<Mail className="h-4 w-4" />}
          onClick={handleGenerateEmail}
          loading={isGeneratingEmail}
        >
          Generate Follow-up Email
        </Button>
        <Button
          variant="outline"
          leftIcon={<RotateCcw className="h-4 w-4" />}
          onClick={() => router.push(ROUTES.SCENARIOS)}
        >
          Practice Again
        </Button>
        <Link href={ROUTES.SCENARIOS}>
          <Button variant="ghost" leftIcon={<Target className="h-4 w-4" />}>
            Try Another Scenario
          </Button>
        </Link>
      </div>
    </div>
  );
}
