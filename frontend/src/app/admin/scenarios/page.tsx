'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Copy,
  ToggleLeft,
  ToggleRight,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ROUTES, DIFFICULTY_LABELS } from '@/lib/constants';
import { cn, getDifficultyColor, formatDate } from '@/lib/utils';

// Mock scenarios data
const mockScenarios = [
  {
    id: '1',
    title: 'Cloud Migration Discussion',
    category: 'Technical Solution',
    difficulty: 'medium' as const,
    isActive: true,
    practiceCount: 234,
    averageScore: 72.5,
    createdAt: '2026-01-01',
    createdBy: 'Training Manager',
  },
  {
    id: '2',
    title: 'Price Objection Handling',
    category: 'Objection Handling',
    difficulty: 'hard' as const,
    isActive: true,
    practiceCount: 189,
    averageScore: 68.3,
    createdAt: '2026-01-02',
    createdBy: 'Training Manager',
  },
  {
    id: '3',
    title: 'Data Security Compliance',
    category: 'Compliance',
    difficulty: 'medium' as const,
    isActive: false,
    practiceCount: 45,
    averageScore: 75.1,
    createdAt: '2026-01-03',
    createdBy: 'Admin',
  },
  {
    id: '4',
    title: 'Competitor Comparison',
    category: 'Competition',
    difficulty: 'hard' as const,
    isActive: true,
    practiceCount: 156,
    averageScore: 70.8,
    createdAt: '2026-01-05',
    createdBy: 'Training Manager',
  },
  {
    id: '5',
    title: 'New Customer Introduction',
    category: 'Opening Conversation',
    difficulty: 'easy' as const,
    isActive: true,
    practiceCount: 312,
    averageScore: 78.2,
    createdAt: '2026-01-07',
    createdBy: 'Admin',
  },
];

export default function AdminScenariosPage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedStatus, setSelectedStatus] = React.useState<'all' | 'active' | 'inactive'>('all');
  const [selectedRows, setSelectedRows] = React.useState<string[]>([]);
  const [openDropdownId, setOpenDropdownId] = React.useState<string | null>(null);

  // Filter scenarios
  const filteredScenarios = mockScenarios.filter((scenario) => {
    const matchesSearch = scenario.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = 
      selectedStatus === 'all' || 
      (selectedStatus === 'active' && scenario.isActive) ||
      (selectedStatus === 'inactive' && !scenario.isActive);
    return matchesSearch && matchesStatus;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(filteredScenarios.map(s => s.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedRows(prev => 
      prev.includes(id) 
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };

  const handleToggleStatus = async (id: string) => {
    // TODO: Call API to toggle status
    console.log('Toggle status for:', id);
    setOpenDropdownId(null);
  };

  const handleDuplicate = async (id: string) => {
    // TODO: Call API to duplicate scenario
    console.log('Duplicate scenario:', id);
    setOpenDropdownId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this scenario?')) {
      // TODO: Call API to delete scenario
      console.log('Delete scenario:', id);
    }
    setOpenDropdownId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scenario Management</h1>
          <p className="text-gray-500 mt-1">
            Create and manage training scenarios
          </p>
        </div>
        <Link href={`${ROUTES.ADMIN_SCENARIOS}/new`}>
          <Button leftIcon={<Plus className="h-4 w-4" />}>
            Create Scenario
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="search"
                placeholder="Search scenarios..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'active', 'inactive'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize',
                    selectedStatus === status
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedRows.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-primary-50 rounded-xl animate-in">
          <span className="text-sm font-medium text-primary-700">
            {selectedRows.length} selected
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Activate
            </Button>
            <Button variant="outline" size="sm">
              Deactivate
            </Button>
            <Button variant="outline" size="sm" className="text-error-600 hover:bg-error-50">
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="p-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === filteredScenarios.length && filteredScenarios.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="p-4 text-left text-sm font-medium text-gray-500">Name</th>
                <th className="p-4 text-left text-sm font-medium text-gray-500">Category</th>
                <th className="p-4 text-left text-sm font-medium text-gray-500">Difficulty</th>
                <th className="p-4 text-left text-sm font-medium text-gray-500">Status</th>
                <th className="p-4 text-left text-sm font-medium text-gray-500">Practices</th>
                <th className="p-4 text-left text-sm font-medium text-gray-500">Avg Score</th>
                <th className="p-4 text-left text-sm font-medium text-gray-500">Created</th>
                <th className="p-4 text-right text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredScenarios.map((scenario) => (
                <tr key={scenario.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(scenario.id)}
                      onChange={() => handleSelectRow(scenario.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="p-4">
                    <Link 
                      href={`${ROUTES.ADMIN_SCENARIOS}/${scenario.id}`}
                      className="font-medium text-gray-900 hover:text-primary-600"
                    >
                      {scenario.title}
                    </Link>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{scenario.category}</td>
                  <td className="p-4">
                    <Badge className={getDifficultyColor(scenario.difficulty)}>
                      {DIFFICULTY_LABELS[scenario.difficulty]}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {scenario.isActive ? (
                        <>
                          <div className="w-2 h-2 rounded-full bg-success-500" />
                          <span className="text-sm text-success-600">Active</span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 rounded-full bg-gray-300" />
                          <span className="text-sm text-gray-500">Inactive</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{scenario.practiceCount}</td>
                  <td className="p-4 text-sm text-gray-600">{scenario.averageScore}</td>
                  <td className="p-4 text-sm text-gray-500">{formatDate(scenario.createdAt)}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1 relative">
                      <Link href={`${ROUTES.ADMIN_SCENARIOS}/${scenario.id}`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <div className="relative">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setOpenDropdownId(openDropdownId === scenario.id ? null : scenario.id)}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                        
                        {openDropdownId === scenario.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-gray-200 shadow-lg py-1 z-10">
                            <button
                              onClick={() => handleToggleStatus(scenario.id)}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              {scenario.isActive ? (
                                <>
                                  <ToggleLeft className="h-4 w-4" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <ToggleRight className="h-4 w-4" />
                                  Activate
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleDuplicate(scenario.id)}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Copy className="h-4 w-4" />
                              Duplicate
                            </button>
                            <button
                              onClick={() => handleDelete(scenario.id)}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-error-600 hover:bg-error-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Showing {filteredScenarios.length} of {mockScenarios.length} scenarios
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

