'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Star, Globe, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import api from '@/lib/api';

interface Language {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  isEnabled: boolean;
  isDefault: boolean;
}

export default function LanguagesPage() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ languagesCount: 0, enabledCount: 0, translationsCount: 0 });

  useEffect(() => {
    fetchLanguages();
    fetchStats();
  }, []);

  const fetchLanguages = async () => {
    try {
      setLoading(true);
      const response = await api.get('/system/languages', {
        params: { includeDisabled: true }
      });
      if (response.data.success) {
        setLanguages(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch languages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/system/languages/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await api.put(`/system/languages/${id}/default`);
      fetchLanguages();
    } catch (error) {
      console.error('Failed to set default:', error);
    }
  };

  const handleToggle = async (id: string, isEnabled: boolean) => {
    try {
      await api.put(`/system/languages/${id}`, { isEnabled: !isEnabled });
      fetchLanguages();
    } catch (error) {
      console.error('Failed to toggle language:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this language?')) return;
    try {
      await api.delete(`/system/languages/${id}`);
      fetchLanguages();
      fetchStats();
    } catch (error) {
      console.error('Failed to delete language:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Languages</h1>
          <p className="text-gray-500">Manage multi-language settings</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Language
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Globe className="h-10 w-10 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.enabledCount}</p>
                <p className="text-sm text-gray-500">Active Languages</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.languagesCount}</p>
              <p className="text-sm text-gray-500">Total Languages</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.translationsCount}</p>
              <p className="text-sm text-gray-500">Translations</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Supported Languages</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : languages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No languages configured</div>
          ) : (
            <div className="space-y-3">
              {languages.map((lang) => (
                <div
                  key={lang.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    lang.isDefault ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-3xl font-bold text-gray-400 w-12">
                      {lang.code.toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{lang.name}</h3>
                        {lang.isDefault && (
                          <Badge variant="primary">
                            <Star className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{lang.nativeName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={lang.isEnabled ? 'success' : 'secondary'}>
                      {lang.isEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                    {!lang.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(lang.id)}
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggle(lang.id, lang.isEnabled)}
                    >
                      {lang.isEnabled ? 'Disable' : 'Enable'}
                    </Button>
                    {!lang.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(lang.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
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

