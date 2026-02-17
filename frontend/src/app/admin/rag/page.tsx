'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, Search, Trash2, FileText, RefreshCw, Eye, 
  Database, File, CheckCircle, XCircle, Clock, Loader2,
  Settings, Download
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';

// RAG Document Interface / RAG文档接口
interface RAGDocument {
  id: string;
  name: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  chunkCount: number;
  chunkSize: number;
  chunkOverlap: number;
  vectorCount: number;
  errorMessage?: string;
  description?: string;
  tags?: string[];
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Statistics Interface / 统计接口
interface RAGStatistics {
  totalDocuments: number;
  byStatus: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
  totalChunks: number;
  totalVectors: number;
  byFileType: Array<{ fileType: string; count: number }>;
  supportedFileTypes: string[];
  maxFileSize: number;
}

// Chunk Interface / 块接口
interface RAGChunk {
  id: string;
  chunkIndex: number;
  text: string;
  startOffset: number;
  endOffset: number;
  hasEmbedding: boolean;
  createdAt: string;
}

export default function RAGPage() {
  const [documents, setDocuments] = useState<RAGDocument[]>([]);
  const [statistics, setStatistics] = useState<RAGStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Upload settings / 上传设置
  const [chunkSize, setChunkSize] = useState('500');
  const [chunkOverlap, setChunkOverlap] = useState('50');
  const [showUploadSettings, setShowUploadSettings] = useState(false);
  
  // Chunks viewer state / 块查看器状态
  const [selectedDocument, setSelectedDocument] = useState<RAGDocument | null>(null);
  const [chunks, setChunks] = useState<RAGChunk[]>([]);
  const [chunksLoading, setChunksLoading] = useState(false);
  const [showChunksModal, setShowChunksModal] = useState(false);
  const [chunksPage, setChunksPage] = useState(1);
  const [chunksTotalPages, setChunksTotalPages] = useState(1);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocuments();
    fetchStatistics();
  }, [search, statusFilter, page]);

  // Fetch documents / 获取文档列表
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { page, pageSize: 10 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      
      const response = await api.get('/admin/rag/documents', { params });
      if (response.data.success) {
        setDocuments(response.data.data.items || []);
        setTotalPages(response.data.data.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics / 获取统计信息
  const fetchStatistics = async () => {
    try {
      const response = await api.get('/admin/rag/statistics');
      if (response.data.success) {
        setStatistics(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  // Handle file upload / 处理文件上传
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chunkSize', chunkSize);
    formData.append('chunkOverlap', chunkOverlap);
    formData.append('autoProcess', 'true');

    try {
      setUploading(true);
      const response = await api.post('/admin/rag/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        fetchDocuments();
        fetchStatistics();
        alert('Document uploaded successfully! Processing started.');
      }
    } catch (error: any) {
      console.error('Failed to upload:', error);
      alert(error.response?.data?.error || 'Failed to upload document');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle delete / 处理删除
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document and its vectors?')) return;
    
    try {
      await api.delete(`/admin/rag/documents/${id}`);
      fetchDocuments();
      fetchStatistics();
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete document');
    }
  };

  // Handle reprocess / 处理重新处理
  const handleReprocess = async (id: string) => {
    try {
      await api.post(`/admin/rag/documents/${id}/reprocess`);
      fetchDocuments();
      alert('Reprocessing started!');
    } catch (error) {
      console.error('Failed to reprocess:', error);
      alert('Failed to reprocess document');
    }
  };

  // View document chunks / 查看文档块
  const handleViewChunks = async (doc: RAGDocument) => {
    setSelectedDocument(doc);
    setShowChunksModal(true);
    setChunksPage(1);
    await fetchChunks(doc.id, 1);
  };

  // Fetch chunks for a document / 获取文档的块
  const fetchChunks = async (documentId: string, page: number) => {
    try {
      setChunksLoading(true);
      const response = await api.get(`/admin/rag/documents/${documentId}/chunks`, {
        params: { page, pageSize: 10 }
      });
      if (response.data.success) {
        setChunks(response.data.data.chunks || []);
        setChunksTotalPages(response.data.data.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch chunks:', error);
      setChunks([]);
    } finally {
      setChunksLoading(false);
    }
  };

  // Handle chunks page change / 处理块分页
  const handleChunksPageChange = (newPage: number) => {
    if (selectedDocument) {
      setChunksPage(newPage);
      fetchChunks(selectedDocument.id, newPage);
    }
  };

  // Format file size / 格式化文件大小
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get status badge / 获取状态标签
  const getStatusBadge = (status: string) => {
    const configs: Record<string, { icon: React.ReactNode; color: string; text: string }> = {
      PENDING: { 
        icon: <Clock className="h-3 w-3" />, 
        color: 'bg-yellow-100 text-yellow-800', 
        text: 'Pending' 
      },
      PROCESSING: { 
        icon: <Loader2 className="h-3 w-3 animate-spin" />, 
        color: 'bg-blue-100 text-blue-800', 
        text: 'Processing' 
      },
      COMPLETED: { 
        icon: <CheckCircle className="h-3 w-3" />, 
        color: 'bg-green-100 text-green-800', 
        text: 'Completed' 
      },
      FAILED: { 
        icon: <XCircle className="h-3 w-3" />, 
        color: 'bg-red-100 text-red-800', 
        text: 'Failed' 
      },
    };
    
    const config = configs[status] || configs.PENDING;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        {config.text}
      </span>
    );
  };

  // Get file type icon / 获取文件类型图标
  const getFileTypeIcon = (fileType: string) => {
    const type = fileType.toLowerCase().replace('.', '');
    if (['pdf'].includes(type)) return <FileText className="h-5 w-5 text-red-500" />;
    if (['doc', 'docx'].includes(type)) return <FileText className="h-5 w-5 text-blue-500" />;
    if (['ppt', 'pptx'].includes(type)) return <FileText className="h-5 w-5 text-orange-500" />;
    if (['xls', 'xlsx'].includes(type)) return <FileText className="h-5 w-5 text-green-500" />;
    if (['txt', 'csv'].includes(type)) return <File className="h-5 w-5 text-gray-500" />;
    return <File className="h-5 w-5 text-gray-400" />;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header / 标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">RAG Documents</h1>
          <p className="text-gray-500">Upload and manage documents for RAG (Retrieval-Augmented Generation)</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowUploadSettings(!showUploadSettings)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Upload Document
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".txt,.csv,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
            onChange={handleUpload}
          />
        </div>
      </div>

      {/* Upload Settings Modal / 上传设置 */}
      {showUploadSettings && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg">Chunking Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chunk Size (characters)
                </label>
                <Input
                  type="number"
                  value={chunkSize}
                  onChange={(e) => setChunkSize(e.target.value)}
                  placeholder="500"
                  min="100"
                  max="2000"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Size of each text chunk. Default: 500 characters
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chunk Overlap (characters)
                </label>
                <Input
                  type="number"
                  value={chunkOverlap}
                  onChange={(e) => setChunkOverlap(e.target.value)}
                  placeholder="50"
                  min="0"
                  max="500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Overlap between chunks. Default: 50 characters
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards / 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Database className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="text-3xl font-bold text-gray-900">{statistics?.totalDocuments || 0}</p>
              <p className="text-sm text-gray-500">Total Documents</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-3xl font-bold text-green-600">{statistics?.byStatus.completed || 0}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <p className="text-3xl font-bold text-purple-600">{statistics?.totalChunks || 0}</p>
              <p className="text-sm text-gray-500">Total Chunks</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Database className="h-8 w-8 mx-auto mb-2 text-indigo-500" />
              <p className="text-3xl font-bold text-indigo-600">{statistics?.totalVectors || 0}</p>
              <p className="text-sm text-gray-500">Vectors Stored</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Supported File Types / 支持的文件类型 */}
      {statistics && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600 font-medium">Supported file types:</span>
              {statistics.supportedFileTypes.map((type) => (
                <span key={type} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                  {type}
                </span>
              ))}
              <span className="text-sm text-gray-400 ml-2">
                Max size: {formatSize(statistics.maxFileSize)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents Table / 文档表格 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
            </select>
            <Button variant="outline" onClick={() => { fetchDocuments(); fetchStatistics(); }}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              <p className="text-gray-500 mt-2">Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <Upload className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-2">No documents uploaded yet</p>
              <p className="text-sm text-gray-400">
                Upload PDF, Word, PowerPoint, Excel, or text files to get started
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Document</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Chunks</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Vectors</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Size</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Uploaded</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {getFileTypeIcon(doc.fileType)}
                          <div>
                            <p className="font-medium text-gray-900">{doc.name}</p>
                            <p className="text-xs text-gray-500">{doc.originalName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(doc.status)}
                        {doc.errorMessage && (
                          <p className="text-xs text-red-500 mt-1 max-w-xs truncate" title={doc.errorMessage}>
                            {doc.errorMessage}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleViewChunks(doc)}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          title="Click to view chunks"
                        >
                          <Eye className="h-3 w-3" />
                          <span className="font-medium">{doc.chunkCount}</span>
                        </button>
                        <span className="text-xs text-gray-400 ml-1">
                          ({doc.chunkSize}/{doc.chunkOverlap})
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-900">{doc.vectorCount}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {formatSize(doc.fileSize)}
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-sm">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          {(doc.status === 'FAILED' || doc.status === 'COMPLETED') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReprocess(doc.id)}
                              title="Reprocess"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(doc.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination / 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chunks Modal / 块查看弹窗 */}
      {showChunksModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header / 弹窗标题 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Document Chunks</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedDocument.name} • {selectedDocument.chunkCount} chunks
                </p>
              </div>
              <button
                onClick={() => {
                  setShowChunksModal(false);
                  setSelectedDocument(null);
                  setChunks([]);
                }}
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content / 弹窗内容 */}
            <div className="flex-1 overflow-y-auto p-6">
              {chunksLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                  <p className="text-gray-500 mt-2">Loading chunks...</p>
                </div>
              ) : chunks.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No chunks found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    This document may not have been processed yet
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chunks.map((chunk) => (
                    <div 
                      key={chunk.id} 
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                            {chunk.chunkIndex + 1}
                          </span>
                          <div>
                            <span className="text-sm text-gray-500">
                              Chunk #{chunk.chunkIndex + 1}
                            </span>
                            <span className="text-xs text-gray-400 ml-2">
                              (offset: {chunk.startOffset} - {chunk.endOffset})
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {chunk.hasEmbedding ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                              <CheckCircle className="h-3 w-3" />
                              Vectorized
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                              <Clock className="h-3 w-3" />
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 font-mono text-sm text-gray-700 whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                        {chunk.text}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer with Pagination / 弹窗底部分页 */}
            {chunksTotalPages > 1 && (
              <div className="flex items-center justify-center gap-4 p-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleChunksPageChange(chunksPage - 1)}
                  disabled={chunksPage === 1 || chunksLoading}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {chunksPage} of {chunksTotalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleChunksPageChange(chunksPage + 1)}
                  disabled={chunksPage === chunksTotalPages || chunksLoading}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

