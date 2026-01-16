'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Star, StarOff, Crown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import api from '@/lib/api';

interface MembershipPlan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  originalPrice?: number;
  currency: string;
  duration: number;
  features: Record<string, unknown>;
  isActive: boolean;
  isFeatured: boolean;
}

interface PointsConfig {
  key: string;
  name: string;
  description?: string;
  points: number;
  isEnabled: boolean;
}

export default function MembershipPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [pointsConfigs, setPointsConfigs] = useState<PointsConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ plansCount: 0, activeSubscribers: 0 });
  const [activeTab, setActiveTab] = useState<'plans' | 'points'>('plans');

  useEffect(() => {
    fetchPlans();
    fetchPointsConfigs();
    fetchStats();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await api.get('/system/membership-plans', {
        params: { includeInactive: true }
      });
      if (response.data.success) {
        setPlans(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPointsConfigs = async () => {
    try {
      const response = await api.get('/system/points-configs');
      if (response.data.success) {
        setPointsConfigs(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch points configs:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/system/membership-plans/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    try {
      await api.delete(`/system/membership-plans/${id}`);
      fetchPlans();
    } catch (error) {
      console.error('Failed to delete plan:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Membership & Points</h1>
          <p className="text-gray-500">Manage membership plans and points system</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Crown className="h-10 w-10 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.activeSubscribers}</p>
                <p className="text-sm text-gray-500">Active Subscribers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Star className="h-10 w-10 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.plansCount}</p>
                <p className="text-sm text-gray-500">Active Plans</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px ${
            activeTab === 'plans'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Membership Plans
        </button>
        <button
          onClick={() => setActiveTab('points')}
          className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px ${
            activeTab === 'points'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Points Configuration
        </button>
      </div>

      {activeTab === 'plans' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Membership Plans</CardTitle>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Plan
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : plans.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No plans found</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`p-4 border rounded-lg ${
                      plan.isFeatured ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                      {plan.isFeatured && <Badge variant="primary">Featured</Badge>}
                    </div>
                    <div className="mb-2">
                      <span className="text-2xl font-bold">${plan.price}</span>
                      {plan.originalPrice && (
                        <span className="text-sm text-gray-400 line-through ml-2">
                          ${plan.originalPrice}
                        </span>
                      )}
                      <span className="text-sm text-gray-500">/{plan.duration} days</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant={plan.isActive ? 'success' : 'secondary'}>
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePlan(plan.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'points' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Points Configuration</CardTitle>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </CardHeader>
          <CardContent>
            {pointsConfigs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No points rules configured</div>
            ) : (
              <div className="space-y-3">
                {pointsConfigs.map((config) => (
                  <div
                    key={config.key}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium text-gray-900">{config.name}</h4>
                      <p className="text-sm text-gray-500">{config.description}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-lg font-bold text-blue-600">+{config.points}</span>
                        <span className="text-sm text-gray-500 ml-1">pts</span>
                      </div>
                      <Badge variant={config.isEnabled ? 'success' : 'secondary'}>
                        {config.isEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

