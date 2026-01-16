'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3,
  TrendingUp,
  Users,
  Activity,
  Download,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { adminApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface StatisticsData {
  overview: {
    totalUsers: number;
    totalScenarios: number;
    totalSessions: number;
    averageScore: number;
    activeUsersToday: number;
    sessionsToday: number;
    userGrowth: number;
    sessionGrowth: number;
  };
  trends: {
    date: string;
    count: number;
  }[];
  scoreDistribution: {
    range: string;
    count: number;
  }[];
  topScenarios: {
    id: string;
    title: string;
    practiceCount: number;
    averageScore?: number;
    avgScore?: number;
  }[];
  recentActivity: {
    user: string;
    action: string;
    scenario: string;
    time: string;
  }[];
}

export default function AdminStatisticsPage() {
  const [data, setData] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [dateRange, setDateRange] = useState('7d');
  const { showToast } = useToast();

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getStatistics();
      
      if (response.success && response.data) {
        // Transform API response to match our interface
        const apiData = response.data;
        setData({
          overview: {
            totalUsers: apiData.totalUsers || 0,
            totalScenarios: apiData.totalScenarios || 0,
            totalSessions: apiData.totalSessions || 0,
            averageScore: apiData.averageScore || 0,
            activeUsersToday: apiData.activeUsersToday || 0,
            sessionsToday: apiData.sessionsToday || 0,
            userGrowth: apiData.userGrowth || 0,
            sessionGrowth: apiData.sessionGrowth || 0,
          },
          trends: apiData.practicesTrend || [],
          scoreDistribution: apiData.scoreDistribution || [],
          topScenarios: apiData.topScenarios || [],
          recentActivity: apiData.recentActivity || [],
        });
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
      showToast('Failed to load statistics', 'error');
      // Set empty data on error
      setData({
        overview: {
          totalUsers: 0,
          totalScenarios: 0,
          totalSessions: 0,
          averageScore: 0,
          activeUsersToday: 0,
          sessionsToday: 0,
          userGrowth: 0,
          sessionGrowth: 0,
        },
        trends: [],
        scoreDistribution: [],
        topScenarios: [],
        recentActivity: [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [dateRange]);

  // Export statistics
  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await adminApi.exportStatistics();
      if (response.success) {
        showToast('Statistics exported successfully', 'success');
        // In a real app, this would trigger a file download
      }
    } catch (error) {
      console.error('Failed to export statistics:', error);
      showToast('Failed to export statistics', 'error');
    } finally {
      setExporting(false);
    }
  };

  // Get score color
  const getScoreColor = (range: string) => {
    if (range.includes('90') || range.includes('100')) return 'bg-success-500';
    if (range.includes('80')) return 'bg-success-400';
    if (range.includes('70')) return 'bg-yellow-500';
    if (range.includes('60')) return 'bg-warning-500';
    return 'bg-error-500';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard className="h-12 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} className="h-24" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <SkeletonCard className="h-64" />
          <SkeletonCard className="h-64" />
        </div>
      </div>
    );
  }

  const overview = data?.overview || {
    totalUsers: 0,
    totalScenarios: 0,
    totalSessions: 0,
    averageScore: 0,
    activeUsersToday: 0,
    sessionsToday: 0,
    userGrowth: 0,
    sessionGrowth: 0,
  };

  const trends = data?.trends || [];
  const scoreDistribution = data?.scoreDistribution || [];
  const topScenarios = data?.topScenarios || [];

  const maxTrendValue = Math.max(...trends.map(t => t.count), 1);
  const totalDistribution = scoreDistribution.reduce((sum, d) => sum + d.count, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Statistics & Analytics</h1>
          <p className="text-gray-500 mt-1">
            Monitor system performance and user engagement
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
          <Button
            variant="outline"
            onClick={fetchStatistics}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={handleExport}
            loading={exporting}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{overview.totalUsers}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm">
              <TrendingUp className="h-4 w-4 text-success-500" />
              <span className="text-success-600 font-medium">+{overview.userGrowth}%</span>
              <span className="text-gray-400">this week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{overview.totalSessions}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Activity className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm">
              <TrendingUp className="h-4 w-4 text-success-500" />
              <span className="text-success-600 font-medium">+{overview.sessionGrowth}%</span>
              <span className="text-gray-400">this week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Today</p>
                <p className="text-2xl font-bold text-gray-900">{overview.activeUsersToday}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-sm text-gray-500">
                {overview.sessionsToday} sessions today
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">{overview.averageScore.toFixed(1)}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-sm text-gray-500">
                Out of 100 points
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Practice Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Practice Sessions Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {trends.length === 0 ? (
              <div className="h-48 flex items-center justify-center">
                <p className="text-gray-400">No data available</p>
              </div>
            ) : (
              <div className="h-48 flex items-end justify-between gap-2">
                {trends.map((item, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs text-gray-500 font-medium">{item.count}</span>
                    <div 
                      className="w-full bg-primary-500 rounded-t-sm transition-all hover:bg-primary-600"
                      style={{ height: `${(item.count / maxTrendValue) * 140}px`, minHeight: '4px' }}
                    />
                    <span className="text-xs text-gray-400">
                      {new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Score Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {scoreDistribution.length === 0 ? (
              <div className="h-48 flex items-center justify-center">
                <p className="text-gray-400">No data available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scoreDistribution.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-16">{item.range}</span>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={cn('h-full rounded-full transition-all', getScoreColor(item.range))}
                        style={{ width: `${(item.count / totalDistribution) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-8 text-right">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Practiced Scenarios</CardTitle>
        </CardHeader>
        <CardContent>
          {topScenarios.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-400">No scenario data available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Rank</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Scenario</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Practice Count</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Avg Score</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {topScenarios.map((scenario, index) => {
                    const maxPractice = Math.max(...topScenarios.map(s => s.practiceCount));
                    const percentage = (scenario.practiceCount / maxPractice) * 100;
                    
                    return (
                      <tr key={scenario.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className={cn(
                            'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold',
                            index === 0 ? 'bg-yellow-100 text-yellow-700' :
                            index === 1 ? 'bg-gray-100 text-gray-700' :
                            index === 2 ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-50 text-gray-500'
                          )}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm font-medium text-gray-900">{scenario.title}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-sm text-gray-600">{scenario.practiceCount}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={cn(
                            'text-sm font-medium',
                            (scenario.averageScore ?? scenario.avgScore ?? 0) >= 80 ? 'text-success-600' :
                            (scenario.averageScore ?? scenario.avgScore ?? 0) >= 60 ? 'text-warning-600' :
                            'text-error-600'
                          )}>
                            {(scenario.averageScore ?? scenario.avgScore ?? 0).toFixed(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary-500 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scenarios Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Scenarios</span>
                <span className="text-sm font-medium text-gray-900">{overview.totalScenarios}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Scenarios</span>
                <span className="text-sm font-medium text-gray-900">{overview.totalScenarios}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg Practices/Scenario</span>
                <span className="text-sm font-medium text-gray-900">
                  {overview.totalScenarios > 0 
                    ? (overview.totalSessions / overview.totalScenarios).toFixed(1) 
                    : 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">User Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Users</span>
                <span className="text-sm font-medium text-gray-900">{overview.totalUsers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Today</span>
                <span className="text-sm font-medium text-gray-900">{overview.activeUsersToday}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg Sessions/User</span>
                <span className="text-sm font-medium text-gray-900">
                  {overview.totalUsers > 0 
                    ? (overview.totalSessions / overview.totalUsers).toFixed(1) 
                    : 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Average Score</span>
                <span className="text-sm font-medium text-gray-900">{overview.averageScore.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Sessions Today</span>
                <span className="text-sm font-medium text-gray-900">{overview.sessionsToday}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Growth Rate</span>
                <span className="text-sm font-medium text-success-600">+{overview.sessionGrowth}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

