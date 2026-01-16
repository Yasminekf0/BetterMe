'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  TrendingUp, 
  Target, 
  Clock, 
  Trophy,
  Play,
  ChevronRight,
  Sparkles,
  Flame,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { SkeletonStatsCard, SkeletonCard } from '@/components/ui/Skeleton';
import { LineChart, ProgressRing } from '@/components/ui/Chart';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/lib/constants';
import { cn, formatRelativeTime, getDifficultyColor } from '@/lib/utils';
import { useUserStatistics, useRecommendedScenarios } from '@/lib/hooks';
import { roleplayApi } from '@/lib/api';
import { Session } from '@/types';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: stats, isLoading: isLoadingStats } = useUserStatistics();
  const { data: recommendedScenarios, isLoading: isLoadingScenarios } = useRecommendedScenarios();
  const [recentPractices, setRecentPractices] = React.useState<Session[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(true);

  const greeting = getGreeting();

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  // Fetch recent practices
  React.useEffect(() => {
    async function fetchRecentPractices() {
      try {
        const response = await roleplayApi.getHistory({ page: 1, pageSize: 3 });
        if (response.success && response.data) {
          setRecentPractices(response.data.items);
        }
      } catch (err) {
        console.warn('Using fallback recent practices:', err);
        // Fallback mock data
        setRecentPractices([
          {
            id: '1',
            userId: 'demo',
            scenarioId: '1',
            scenario: { title: 'Cloud Migration Sales' } as Session['scenario'],
            status: 'completed',
            messages: [],
            feedback: { overallScore: 78 } as Session['feedback'],
            startedAt: new Date(Date.now() - 3600000).toISOString(),
            completedAt: new Date().toISOString(),
          },
          {
            id: '2',
            userId: 'demo',
            scenarioId: '2',
            scenario: { title: 'New Customer Opening' } as Session['scenario'],
            status: 'completed',
            messages: [],
            feedback: { overallScore: 82 } as Session['feedback'],
            startedAt: new Date(Date.now() - 86400000).toISOString(),
            completedAt: new Date(Date.now() - 82800000).toISOString(),
          },
          {
            id: '3',
            userId: 'demo',
            scenarioId: '3',
            scenario: { title: 'Competitor Response' } as Session['scenario'],
            status: 'completed',
            messages: [],
            feedback: { overallScore: 65 } as Session['feedback'],
            startedAt: new Date(Date.now() - 172800000).toISOString(),
            completedAt: new Date(Date.now() - 169200000).toISOString(),
          },
        ]);
      } finally {
        setIsLoadingHistory(false);
      }
    }
    fetchRecentPractices();
  }, []);

  // Default values for stats
  const displayStats = {
    totalPractices: stats?.totalPractices ?? 0,
    averageScore: stats?.averageScore ?? 0,
    thisWeekPractices: stats?.thisWeekPractices ?? 0,
    thisWeekTarget: stats?.thisWeekTarget ?? 5,
    bestScore: stats?.bestScore ?? 0,
    scoreHistory: stats?.scoreHistory ?? [],
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting}, {user?.name?.split(' ')[0] || 'there'}! 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Keep improving your sales skills. Practice makes perfect.
          </p>
        </div>
        <Link href={ROUTES.SCENARIOS}>
          <Button rightIcon={<ArrowRight className="h-4 w-4" />}>
            Start Practice
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      {isLoadingStats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonStatsCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary-50">
                  <Target className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Practices</p>
                  <p className="text-2xl font-bold text-gray-900">{displayStats.totalPractices}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary-50">
                  <TrendingUp className="h-5 w-5 text-secondary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Average Score</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-gray-900">
                      {displayStats.averageScore > 0 ? displayStats.averageScore.toFixed(1) : '--'}
                    </p>
                    {displayStats.averageScore > 0 && (
                      <span className="text-xs text-success-600 font-medium">+2.3%</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning-50">
                  <Clock className="h-5 w-5 text-warning-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">This Week</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-gray-900">
                      {displayStats.thisWeekPractices}/{displayStats.thisWeekTarget}
                    </p>
                  </div>
                  <Progress 
                    value={displayStats.thisWeekPractices} 
                    max={displayStats.thisWeekTarget} 
                    className="mt-1 h-1.5" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success-50">
                  <Trophy className="h-5 w-5 text-success-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Best Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {displayStats.bestScore > 0 ? displayStats.bestScore : '--'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Progress Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">My Progress Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {displayStats.scoreHistory.length > 0 ? (
            <div className="h-48 flex items-end justify-between gap-2">
              {displayStats.scoreHistory.slice(-7).map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500 font-medium">{item.score}</span>
                  <div 
                    className="w-full bg-primary-500 rounded-t-sm transition-all hover:bg-primary-600"
                    style={{ height: `${(item.score / 100) * 160}px` }}
                  />
                  <span className="text-xs text-gray-400">
                    {new Date(item.date).getDate()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500">No practice history yet</p>
                <p className="text-sm text-gray-400 mt-1">Complete some practices to see your progress</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommended Scenarios */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recommended for You</h2>
          <Link 
            href={ROUTES.SCENARIOS}
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            View All <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        {isLoadingScenarios ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : recommendedScenarios.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedScenarios.slice(0, 3).map((scenario, index) => (
              <Card key={scenario.id} hover>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <Badge 
                      variant={index === 0 ? 'warning' : index === 1 ? 'success' : 'primary'}
                    >
                      {index === 0 && '🎯 Improve'}
                      {index === 1 && '🆕 New'}
                      {index === 2 && '🔥 Popular'}
                    </Badge>
                    <Badge className={getDifficultyColor(scenario.difficulty)}>
                      {scenario.difficulty}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{scenario.title}</h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{scenario.description}</p>
                  <Link href={ROUTES.SCENARIO_DETAIL(scenario.id)}>
                    <Button variant="outline" size="sm" className="w-full" leftIcon={<Play className="h-4 w-4" />}>
                      Start Practice
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500">No scenarios available yet</p>
              <Link href={ROUTES.SCENARIOS} className="mt-4 inline-block">
                <Button variant="outline" size="sm">Browse All Scenarios</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Practices */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Practices</h2>
          <Link 
            href={ROUTES.HISTORY}
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            View All <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <Card>
          <CardContent className="p-0">
            {isLoadingHistory ? (
              <div className="p-4">
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="h-4 bg-gray-200 rounded flex-1" />
                      <div className="h-8 w-16 bg-gray-200 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            ) : recentPractices.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {recentPractices.map((practice) => (
                  <div 
                    key={practice.id}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {practice.scenario?.title || 'Practice Session'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {practice.completedAt ? formatRelativeTime(practice.completedAt) : 'In progress'}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={cn(
                          'text-lg font-bold',
                          (practice.feedback?.overallScore ?? 0) >= 80 ? 'text-success-600' :
                          (practice.feedback?.overallScore ?? 0) >= 60 ? 'text-warning-600' : 'text-error-600'
                        )}>
                          {practice.feedback?.overallScore ?? '--'}
                        </p>
                        <p className="text-xs text-gray-400">points</p>
                      </div>
                      <div className="flex gap-2">
                        <Link href={ROUTES.FEEDBACK(practice.id)}>
                          <Button variant="ghost" size="sm">Feedback</Button>
                        </Link>
                        <Link href={ROUTES.SCENARIO_DETAIL(practice.scenarioId)}>
                          <Button variant="ghost" size="sm">Retry</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500">No practice history yet</p>
                <p className="text-sm text-gray-400 mt-1">Start practicing to see your sessions here</p>
                <Link href={ROUTES.SCENARIOS} className="mt-4 inline-block">
                  <Button size="sm">Start Your First Practice</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
