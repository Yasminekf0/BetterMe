'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Play, 
  Clock, 
  Users, 
  Star, 
  Target,
  AlertCircle,
  TrendingUp,
  Sparkles,
  BookOpen,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { ROUTES, DIFFICULTY_LABELS } from '@/lib/constants';
import { cn, getDifficultyColor } from '@/lib/utils';
import { useScenario } from '@/lib/hooks';
import { roleplayApi } from '@/lib/api';

export default function ScenarioDetailPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const scenarioId = params.id as string;
  const [isStarting, setIsStarting] = React.useState(false);

  // Fetch scenario data using the hook
  const { data: scenario, isLoading, error, refetch } = useScenario(scenarioId);

  // User history for this scenario (would come from API)
  const [userHistory] = React.useState({
    practiceCount: 3,
    bestScore: 78,
    averageScore: 72,
    recentScores: [78, 70, 68],
  });

  // Practice goals (derived from scenario or default)
  const practiceGoals = React.useMemo(() => [
    'Clearly articulate cloud core value proposition',
    'Effectively handle security and compliance objections',
    'Demonstrate technical expertise and credibility',
    'Propose concrete next steps',
  ], []);

  const handleStartPractice = async () => {
    setIsStarting(true);
    try {
      const response = await roleplayApi.start(scenarioId);
      if (response.success && response.data) {
        toast.success('Session started! Let\'s begin the roleplay.');
        router.push(ROUTES.ROLEPLAY(response.data.id));
      } else {
        toast.error('Failed to start session. Please try again.');
        setIsStarting(false);
      }
    } catch (err) {
      console.warn('API call failed, using demo session:', err);
      // Fallback to demo session for testing
      router.push(ROUTES.ROLEPLAY(`demo-${scenarioId}`));
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-5xl space-y-6">
        <Skeleton className="h-6 w-48" />
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-32 rounded-full" />
                </div>
                <Skeleton className="h-8 w-3/4" />
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <SkeletonText lines={3} />
              </div>
              <Skeleton className="h-12 w-full lg:w-48" />
            </div>
          </CardContent>
        </Card>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <SkeletonText lines={8} />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card><CardContent className="p-6"><SkeletonText lines={4} /></CardContent></Card>
            <Card><CardContent className="p-6"><SkeletonText lines={4} /></CardContent></Card>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !scenario) {
    return (
      <div className="max-w-5xl space-y-6">
        <Link
          href={ROUTES.SCENARIOS}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Scenarios</span>
        </Link>
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-error-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-error-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Scenario Not Found</h3>
            <p className="text-gray-500 mb-6">{error || 'The scenario you are looking for does not exist.'}</p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      {/* Back Button */}
      <Link
        href={ROUTES.SCENARIOS}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Scenarios</span>
      </Link>

      {/* Header Card */}
      <Card className="overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-50 to-transparent rounded-bl-full opacity-50" />
        <CardContent className="p-6 relative">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              {/* Tags */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge className={cn(getDifficultyColor(scenario.difficulty), 'font-semibold')}>
                  {DIFFICULTY_LABELS[scenario.difficulty]}
                </Badge>
                <Badge variant="outline" className="bg-white/80">
                  <BookOpen className="h-3 w-3 mr-1" />
                  {scenario.category}
                </Badge>
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                {scenario.title}
              </h1>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-full">
                  <Clock className="h-4 w-4 text-gray-600" />
                  <span>~{scenario.estimatedDuration || 15} min</span>
                </div>
                <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-full">
                  <Users className="h-4 w-4 text-gray-600" />
                  <span>{scenario.practiceCount || 0} practices</span>
                </div>
                <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-full">
                  <Star className="h-4 w-4 text-warning-500" />
                  <span>Avg {scenario.averageScore?.toFixed(1) || '--'}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-600 leading-relaxed">
                {scenario.description}
              </p>
            </div>

            {/* Action */}
            <div className="lg:w-52 shrink-0 space-y-3">
              <Button
                size="lg"
                className="w-full shadow-lg shadow-primary-500/25"
                leftIcon={<Play className="h-5 w-5" />}
                onClick={handleStartPractice}
                loading={isStarting}
              >
                Start Practice
              </Button>
              <p className="text-xs text-center text-gray-400">
                Practice conversation with AI buyer
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Buyer Persona */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-primary-600" />
                </div>
                Buyer Persona
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Persona Header */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary-50 to-transparent rounded-xl border border-primary-100">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-bold text-white">
                    {scenario.buyerPersona?.name?.charAt(0) || 'B'}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {scenario.buyerPersona?.name || 'AI Buyer'}
                  </h3>
                  <p className="text-gray-600">
                    {scenario.buyerPersona?.role || 'Decision Maker'} @ {scenario.buyerPersona?.company || 'Company'}
                  </p>
                </div>
              </div>

              {/* Background */}
              {scenario.buyerPersona?.background && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary-500" />
                    Background
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed pl-6">
                    {scenario.buyerPersona.background}
                  </p>
                </div>
              )}

              {/* Concerns */}
              {scenario.buyerPersona?.concerns && scenario.buyerPersona.concerns.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-warning-500" />
                    Key Concerns
                  </h4>
                  <div className="flex flex-wrap gap-2 pl-6">
                    {scenario.buyerPersona.concerns.map((concern, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-warning-50 text-warning-700 rounded-lg text-sm font-medium border border-warning-100"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-warning-500" />
                        {concern}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Personality */}
              {scenario.buyerPersona?.personality && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Personality</h4>
                  <p className="text-gray-600 text-sm leading-relaxed pl-6 py-2 border-l-2 border-gray-200">
                    {scenario.buyerPersona.personality}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Practice Goals */}
          <Card>
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-success-100 flex items-center justify-center">
                  <Target className="h-4 w-4 text-success-600" />
                </div>
                Practice Goals
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ul className="space-y-3">
                {practiceGoals.map((goal, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-success-100 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-success-600">{index + 1}</span>
                    </div>
                    <span className="text-sm text-gray-600">{goal}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* My History */}
          {userHistory && userHistory.practiceCount > 0 && (
            <Card>
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-secondary-100 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-secondary-600" />
                  </div>
                  My History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <p className="text-2xl font-bold text-gray-900">
                      {userHistory.practiceCount}
                    </p>
                    <p className="text-xs text-gray-500">Practices</p>
                  </div>
                  <div className="text-center p-3 bg-primary-50 rounded-xl">
                    <p className="text-2xl font-bold text-primary-600">
                      {userHistory.bestScore}
                    </p>
                    <p className="text-xs text-gray-500">Best Score</p>
                  </div>
                </div>

                {/* Score Trend */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Recent Scores</span>
                    <span className="flex items-center gap-1 text-sm text-success-600">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Improving
                    </span>
                  </div>
                  <div className="flex items-end gap-1.5 h-16 p-2 bg-gray-50 rounded-lg">
                    {userHistory.recentScores.slice().reverse().map((score, index) => (
                      <div
                        key={index}
                        className={cn(
                          'flex-1 rounded-t transition-all',
                          score >= 80 ? 'bg-success-500' :
                          score >= 60 ? 'bg-warning-500' : 'bg-error-500'
                        )}
                        style={{ height: `${(score / 100) * 48}px` }}
                      />
                    ))}
                  </div>
                </div>

                <Progress
                  value={userHistory.averageScore}
                  max={100}
                  showLabel
                  labelFormat={(v) => `Avg: ${v}/100`}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

