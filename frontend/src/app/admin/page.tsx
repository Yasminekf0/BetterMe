'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  FileText, 
  BarChart3, 
  Settings,
  TrendingUp,
  ArrowRight,
  Activity,
  Bot,
  ScrollText,
  UserCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { adminApi } from '@/lib/api';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface DashboardStats {
  activeUsersToday: number;
  sessionsToday: number;
  activeScenarios: number;
  averageScore: number;
  userGrowth: number;
  sessionGrowth: number;
  totalUsers: number;
  totalScenarios: number;
  totalSessions: number;
}

interface TrendItem {
  date: string;
  count: number;
}

interface ScoreDistItem {
  range: string;
  count: number;
}

interface RecentActivity {
  user: string;
  action: string;
  scenario: string;
  time: string;
}

const defaultStats: DashboardStats = {
  activeUsersToday: 0,
  sessionsToday: 0,
  activeScenarios: 0,
  averageScore: 0,
  userGrowth: 0,
  sessionGrowth: 0,
  totalUsers: 0,
  totalScenarios: 0,
  totalSessions: 0,
};

const quickLinks = [
  { href: ROUTES.ADMIN_SCENARIOS, label: 'Manage Scenarios', icon: FileText, color: 'bg-blue-100 text-blue-600' },
  { href: ROUTES.ADMIN_USERS, label: 'Manage Users', icon: Users, color: 'bg-purple-100 text-purple-600' },
  { href: ROUTES.ADMIN_STATISTICS, label: 'View Statistics', icon: BarChart3, color: 'bg-green-100 text-green-600' },
  { href: ROUTES.ADMIN_SETTINGS, label: 'System Settings', icon: Settings, color: 'bg-orange-100 text-orange-600' },
  { href: ROUTES.ADMIN_AI_MODELS, label: 'AI Models', icon: Bot, color: 'bg-cyan-100 text-cyan-600' },
  { href: ROUTES.ADMIN_PERSONAS, label: 'Buyer Personas', icon: UserCircle, color: 'bg-pink-100 text-pink-600' },
  { href: ROUTES.ADMIN_LOGS, label: 'Operation Logs', icon: ScrollText, color: 'bg-yellow-100 text-yellow-600' },
];

const scoreDistColors: Record<string, string> = {
  '0-60': 'bg-error-500',
  '60-70': 'bg-warning-500',
  '70-80': 'bg-yellow-500',
  '80-90': 'bg-success-400',
  '90-100': 'bg-success-600',
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [practicesTrend, setPracticesTrend] = useState<TrendItem[]>([]);
  const [scoreDistribution, setScoreDistribution] = useState<ScoreDistItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await adminApi.getStatistics();
        
        if (response.success && response.data) {
          const data = response.data;
          setStats({
            activeUsersToday: data.activeUsersToday || 0,
            sessionsToday: data.sessionsToday || 0,
            activeScenarios: data.activeScenarios || 0,
            averageScore: data.averageScore || 0,
            userGrowth: data.userGrowth || 0,
            sessionGrowth: data.sessionGrowth || 0,
            totalUsers: data.totalUsers || 0,
            totalScenarios: data.totalScenarios || 0,
            totalSessions: data.totalSessions || 0,
          });
          setPracticesTrend(data.practicesTrend || []);
          setScoreDistribution(data.scoreDistribution || []);
          setRecentActivity(data.recentActivity || []);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        showToast('Failed to load dashboard data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const maxCount = practicesTrend.length > 0 
    ? Math.max(...practicesTrend.map(d => d.count), 1) 
    : 1;
  const totalDistribution = scoreDistribution.reduce((sum, d) => sum + d.count, 0) || 1;

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Overview of system performance and activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Users Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeUsersToday}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm">
              <TrendingUp className="h-4 w-4 text-success-500" />
              <span className="text-success-600 font-medium">+{stats.userGrowth}%</span>
              <span className="text-gray-400">vs yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Sessions Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats.sessionsToday}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Activity className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm">
              <TrendingUp className="h-4 w-4 text-success-500" />
              <span className="text-success-600 font-medium">+{stats.sessionGrowth}%</span>
              <span className="text-gray-400">vs yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Scenarios</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeScenarios}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="mt-2">
              <Link href={ROUTES.ADMIN_SCENARIOS} className="text-sm text-primary-600 hover:text-primary-700">
                Manage →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageScore.toFixed(1)}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <div className="mt-2">
              <Link href={ROUTES.ADMIN_STATISTICS} className="text-sm text-primary-600 hover:text-primary-700">
                View Details →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Practice Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Practice Trend (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {practicesTrend.length === 0 ? (
              <div className="h-48 flex items-center justify-center">
                <p className="text-gray-400">No data available</p>
              </div>
            ) : (
              <div className="h-48 flex items-end justify-between gap-2">
                {practicesTrend.map((item, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs text-gray-500 font-medium">{item.count}</span>
                    <div 
                      className="w-full bg-primary-500 rounded-t-sm transition-all hover:bg-primary-600"
                      style={{ height: `${(item.count / maxCount) * 140}px`, minHeight: '4px' }}
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

        {/* Score Distribution */}
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
                        className={cn('h-full rounded-full transition-all', scoreDistColors[item.range] || 'bg-gray-400')}
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

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickLinks.slice(0, 6).map((link) => {
                const Icon = link.icon;
                return (
                  <Link key={link.href} href={link.href}>
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all">
                      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', link.color)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{link.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <Link href={ROUTES.ADMIN_LOGS}>
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="py-8 text-center">
                <Activity className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {activity.user.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">
                        <span className="font-medium">{activity.user}</span>
                        {' '}{activity.action}{' '}
                        <span className="text-gray-600">{activity.scenario}</span>
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{activity.time}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">System Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary-600">{stats.totalUsers}</p>
              <p className="text-sm text-gray-500 mt-1">Total Users</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{stats.totalScenarios}</p>
              <p className="text-sm text-gray-500 mt-1">Total Scenarios</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{stats.totalSessions}</p>
              <p className="text-sm text-gray-500 mt-1">Total Sessions</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
