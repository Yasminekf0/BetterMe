'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Send, Trash2, Edit, Bell } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import api from '@/lib/api';

interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'SYSTEM' | 'ANNOUNCEMENT' | 'PROMOTION' | 'UPDATE';
  targetType: 'ALL' | 'SPECIFIC' | 'ROLE';
  sentAt?: string;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, [search]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications', {
        params: { search: search || undefined }
      });
      if (response.data.success) {
        setNotifications(response.data.data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/send`);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;
    try {
      await api.delete(`/notifications/${id}`);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'SYSTEM':
        return <Badge variant="primary">System</Badge>;
      case 'ANNOUNCEMENT':
        return <Badge variant="success">Announcement</Badge>;
      case 'PROMOTION':
        return <Badge variant="warning">Promotion</Badge>;
      case 'UPDATE':
        return <Badge variant="secondary">Update</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500">Manage system notifications</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Notification
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search notifications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-gray-900">{notification.title}</h3>
                        {getTypeBadge(notification.type)}
                        {notification.sentAt ? (
                          <Badge variant="success">Sent</Badge>
                        ) : (
                          <Badge variant="warning">Draft</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{notification.content}</p>
                      <p className="text-xs text-gray-400">
                        Created: {new Date(notification.createdAt).toLocaleString()}
                        {notification.sentAt && ` | Sent: ${new Date(notification.sentAt).toLocaleString()}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {!notification.sentAt && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSend(notification.id)}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Send
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingNotification(notification);
                              setShowModal(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(notification.id)}
                        className="text-red-600 hover:text-red-700"
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
    </div>
  );
}

