'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  User as UserIcon,
  Mail,
  Building,
  Calendar,
  Activity,
  Award,
  TrendingUp,
  Clock,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { adminApi } from '@/lib/api';
import { ROUTES } from '@/lib/constants';
import { UserDetails } from '@/types';

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const [data, setData] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        const response = await adminApi.getUserDetails(userId);
        if (response.success && response.data) {
          setData(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch user details:', error);
        showToast('Failed to load user details', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  // Get role badge
  const getRoleBadge = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return <Badge variant="primary">Admin</Badge>;
      case 'trainer':
        return <Badge variant="success">Trainer</Badge>;
      default:
        return <Badge variant="secondary">User</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <SkeletonCard className="h-10 w-10" />
          <SkeletonCard className="h-8 w-48" />
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <SkeletonCard className="h-64" />
          <SkeletonCard className="h-64 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <UserIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">User not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push(ROUTES.ADMIN_USERS)}
        >
          Back to Users
        </Button>
      </div>
    );
  }

  const { user, statistics, recentSessions, topScenarios } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={ROUTES.ADMIN_USERS}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-500">{user.email}</p>
          </div>
        </div>
        {getRoleBadge(user.role)}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">User Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mb-4">
                <span className="text-3xl font-bold text-primary-600">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
              {getRoleBadge(user.role)}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Building className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{user.department || 'No department'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Activity className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{statistics.totalSessions}</p>
                <p className="text-sm text-gray-500">Total Sessions</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <FileText className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{statistics.completedSessions}</p>
                <p className="text-sm text-gray-500">Completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{statistics.averageScore.toFixed(1)}</p>
                <p className="text-sm text-gray-500">Avg Score</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Award className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{statistics.bestScore}</p>
                <p className="text-sm text-gray-500">Best Score</p>
              </CardContent>
            </Card>
          </div>

          {/* Score Trend */}
          {statistics.scoreTrend.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Score Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-32 flex items-end justify-between gap-2">
                  {statistics.scoreTrend.map((item, index) => {
                    const maxScore = Math.max(...statistics.scoreTrend.map(s => s.score));
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs text-gray-500">{item.score}</span>
                        <div 
                          className="w-full bg-primary-500 rounded-t-sm"
                          style={{ height: `${(item.score / maxScore) * 80}px` }}
                        />
                        <span className="text-xs text-gray-400">
                          {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Practice Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentSessions.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No practice sessions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSessions.map((session) => (
                  <div 
                    key={session.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{session.scenarioTitle}</p>
                      <p className="text-xs text-gray-500">{session.scenarioCategory}</p>
                    </div>
                    <div className="text-right">
                      {session.score ? (
                        <p className="font-medium text-primary-600">{session.score}</p>
                      ) : (
                        <p className="text-gray-400 text-sm">-</p>
                      )}
                      <p className="text-xs text-gray-400">
                        {new Date(session.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Scenarios */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Most Practiced Scenarios</CardTitle>
          </CardHeader>
          <CardContent>
            {topScenarios.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No scenarios practiced yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topScenarios.map((scenario, index) => {
                  const maxCount = Math.max(...topScenarios.map(s => s.practiceCount));
                  const percentage = (scenario.practiceCount / maxCount) * 100;
                  
                  return (
                    <div key={scenario.scenarioId}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{scenario.title}</span>
                        <span className="text-sm text-gray-500">{scenario.practiceCount}x</span>
                      </div>
                      <Progress value={percentage} />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

