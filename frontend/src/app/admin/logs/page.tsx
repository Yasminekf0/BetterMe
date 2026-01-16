'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Settings,
  Shield,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { SkeletonTableRow } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { adminApi } from '@/lib/api';
import { OperationLog } from '@/types';

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [operationType, setOperationType] = useState<string>('');
  const [targetType, setTargetType] = useState<string>('');
  const { showToast } = useToast();

  // Fetch logs
  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getOperationLogs({
        page,
        pageSize: 20,
        operationType: operationType || undefined,
        targetType: targetType || undefined,
      });
      
      if (response.success && response.data) {
        setLogs(response.data.items);
        setTotalPages(response.data.totalPages);
        setTotal(response.data.total);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      showToast('Failed to load operation logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, operationType, targetType]);

  // Get operation type badge
  const getOperationBadge = (type: string) => {
    switch (type.toUpperCase()) {
      case 'CREATE':
        return <Badge variant="success">CREATE</Badge>;
      case 'UPDATE':
        return <Badge variant="primary">UPDATE</Badge>;
      case 'DELETE':
        return <Badge variant="error">DELETE</Badge>;
      case 'LOGIN':
        return <Badge variant="secondary">LOGIN</Badge>;
      case 'LOGOUT':
        return <Badge variant="secondary">LOGOUT</Badge>;
      case 'VIEW':
        return <Badge variant="outline">VIEW</Badge>;
      case 'TOGGLE_STATUS':
        return <Badge variant="warning">TOGGLE</Badge>;
      case 'RESET':
        return <Badge variant="warning">RESET</Badge>;
      case 'EXPORT':
        return <Badge variant="primary">EXPORT</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // Get target type icon
  const getTargetIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'USER':
        return <UserIcon className="h-4 w-4" />;
      case 'SCENARIO':
        return <FileText className="h-4 w-4" />;
      case 'SETTING':
        return <Settings className="h-4 w-4" />;
      case 'AIMODEL':
        return <Activity className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operation Logs</h1>
          <p className="text-gray-500 mt-1">
            View system operation history and audit trail
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {total} logs total
          </span>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={operationType}
                onChange={(e) => {
                  setOperationType(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Operations</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="LOGIN">Login</option>
                <option value="VIEW">View</option>
                <option value="TOGGLE_STATUS">Toggle Status</option>
                <option value="RESET">Reset</option>
                <option value="EXPORT">Export</option>
              </select>
              <select
                value={targetType}
                onChange={(e) => {
                  setTargetType(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Targets</option>
                <option value="USER">User</option>
                <option value="SCENARIO">Scenario</option>
                <option value="SETTING">Setting</option>
                <option value="AIMODEL">AI Model</option>
                <option value="PERSONA_TEMPLATE">Persona Template</option>
                <option value="STATISTICS">Statistics</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Operation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <SkeletonTableRow key={i} columns={6} />
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No operation logs found</p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getOperationBadge(log.operationType)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">
                            {getTargetIcon(log.targetType)}
                          </span>
                          <span className="text-sm text-gray-700">{log.targetType}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                        {log.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.userId.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.ipAddress || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

