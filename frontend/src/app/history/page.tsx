'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Search, 
  Clock,
  MessageSquare,
  Eye,
  RotateCcw,
  Target,
  TrendingUp,
  Calendar,
  ChevronRight,
  Inbox
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';
import { ROUTES, DIFFICULTY_LABELS } from '@/lib/constants';
import { cn, formatRelativeTime, getDifficultyColor, getScoreColor } from '@/lib/utils';
import { roleplayApi } from '@/lib/api';
import { Session } from '@/types';

interface HistoryItem {
  id: string;
  scenario: {
    title: string;
    difficulty: 'easy' | 'medium' | 'hard';
    category: string;
  };
  score: number;
  duration: number;
  messageCount: number;
  completedAt: string;
}

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortBy, setSortBy] = React.useState<'date' | 'score'>('date');
  const [history, setHistory] = React.useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(false);

  // Fetch history data
  React.useEffect(() => {
    async function fetchHistory() {
      setIsLoading(true);
      try {
        const response = await roleplayApi.getHistory({ page, pageSize: 20 });
        if (response.success && response.data) {
          const items = response.data.items.map((session: Session) => ({
            id: session.id,
            scenario: {
              title: session.scenario?.title || 'Practice Session',
              difficulty: session.scenario?.difficulty || 'medium',
              category: session.scenario?.category || 'General',
            },
            score: session.feedback?.overallScore || 0,
            duration: Math.round((new Date(session.completedAt || session.startedAt).getTime() - new Date(session.startedAt).getTime()) / 60000) || 10,
            messageCount: session.messages?.length || 0,
            completedAt: session.completedAt || session.startedAt,
          }));
          setHistory(items);
          setHasMore(response.data.items.length < response.data.total);
        }
      } catch (err) {
        console.warn('Using fallback history data:', err);
        // Fallback mock data
        setHistory([
          { id: '1', scenario: { title: 'Cloud Migration Discussion', difficulty: 'medium', category: 'Technical' }, score: 78, duration: 12, messageCount: 8, completedAt: new Date(Date.now() - 3600000).toISOString() },
          { id: '2', scenario: { title: 'Price Objection Handling', difficulty: 'hard', category: 'Objections' }, score: 65, duration: 15, messageCount: 10, completedAt: new Date(Date.now() - 86400000).toISOString() },
          { id: '3', scenario: { title: 'New Customer Introduction', difficulty: 'easy', category: 'Opening' }, score: 85, duration: 8, messageCount: 6, completedAt: new Date(Date.now() - 172800000).toISOString() },
          { id: '4', scenario: { title: 'Data Security Compliance', difficulty: 'medium', category: 'Compliance' }, score: 72, duration: 14, messageCount: 9, completedAt: new Date(Date.now() - 259200000).toISOString() },
          { id: '5', scenario: { title: 'Competitor Comparison', difficulty: 'hard', category: 'Competition' }, score: 68, duration: 18, messageCount: 12, completedAt: new Date(Date.now() - 345600000).toISOString() },
        ]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchHistory();
  }, [page]);

  // Filter and sort history
  const filteredHistory = React.useMemo(() => {
    return history
      .filter((item) => 
        item.scenario.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.scenario.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        if (sortBy === 'score') {
          return b.score - a.score;
        }
        return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
      });
  }, [history, searchQuery, sortBy]);

  // Calculate stats
  const stats = React.useMemo(() => {
    if (history.length === 0) return { total: 0, avgScore: 0, bestScore: 0, totalTime: 0 };
    return {
      total: history.length,
      avgScore: Math.round(history.reduce((sum, h) => sum + h.score, 0) / history.length),
      bestScore: Math.max(...history.map(h => h.score)),
      totalTime: history.reduce((sum, h) => sum + h.duration, 0),
    };
  }, [history]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-72" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16" /></CardContent></Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-0">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 border-b border-gray-100 last:border-0">
                <SkeletonText lines={2} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Practice History</h1>
        <p className="text-gray-500 mt-1">
          Review your past practice sessions and track your progress
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500">Total Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary-400 to-secondary-600 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.avgScore || '--'}</p>
                <p className="text-xs text-gray-500">Average Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-success-400 to-success-600 flex items-center justify-center">
                <span className="text-white font-bold">🏆</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.bestScore || '--'}</p>
                <p className="text-xs text-gray-500">Best Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTime}</p>
                <p className="text-xs text-gray-500">Total Minutes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="search"
            placeholder="Search by scenario name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            className={cn(
              'px-4 py-1.5 text-sm font-medium rounded-md transition-all',
              sortBy === 'date'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
            onClick={() => setSortBy('date')}
          >
            <Calendar className="h-4 w-4 inline mr-1" />
            By Date
          </button>
          <button
            className={cn(
              'px-4 py-1.5 text-sm font-medium rounded-md transition-all',
              sortBy === 'score'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
            onClick={() => setSortBy('score')}
          >
            <TrendingUp className="h-4 w-4 inline mr-1" />
            By Score
          </button>
        </div>
      </div>

      {/* History List */}
      {filteredHistory.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {filteredHistory.map((item, index) => (
                <div 
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 hover:bg-gray-50 transition-colors group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Score Badge */}
                  <div className={cn(
                    'w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0',
                    item.score >= 80 ? 'bg-success-100' :
                    item.score >= 60 ? 'bg-warning-100' : 'bg-error-100'
                  )}>
                    <span className={cn(
                      'text-xl font-bold',
                      getScoreColor(item.score)
                    )}>
                      {item.score}
                    </span>
                    <span className="text-[10px] text-gray-500">pts</span>
                  </div>

                  {/* Scenario Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                        {item.scenario.title}
                      </h3>
                      <Badge className={cn(getDifficultyColor(item.scenario.difficulty), 'text-xs')}>
                        {DIFFICULTY_LABELS[item.scenario.difficulty]}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">{item.scenario.category}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {item.duration} min
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {item.messageCount} msgs
                      </span>
                      <span className="text-gray-400">{formatRelativeTime(item.completedAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={ROUTES.FEEDBACK(item.id)}>
                      <Button variant="outline" size="sm" leftIcon={<Eye className="h-4 w-4" />}>
                        Feedback
                      </Button>
                    </Link>
                    <Link href={ROUTES.SCENARIO_DETAIL(item.id)}>
                      <Button variant="ghost" size="sm" leftIcon={<RotateCcw className="h-4 w-4" />}>
                        Retry
                      </Button>
                    </Link>
                  </div>
                  
                  <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-gray-500 transition-colors hidden sm:block" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Empty State */
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Inbox className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No sessions found' : 'No practice history yet'}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {searchQuery 
                ? 'Try a different search term or clear your filters'
                : 'Start practicing with scenarios to see your progress here'
              }
            </p>
            {searchQuery ? (
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                Clear Search
              </Button>
            ) : (
              <Link href={ROUTES.SCENARIOS}>
                <Button>Browse Scenarios</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="text-center">
          <Button variant="outline" onClick={() => setPage(p => p + 1)}>
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}

