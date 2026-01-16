'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users,
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  Save,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Building,
  Briefcase
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { adminApi } from '@/lib/api';
import { BuyerPersonaTemplate } from '@/types';

interface PersonaFormData {
  name: string;
  role: string;
  company: string;
  background: string;
  concerns: string[];
  personality: string;
  category: string;
  isDefault: boolean;
  isActive: boolean;
}

const initialFormData: PersonaFormData = {
  name: '',
  role: '',
  company: '',
  background: '',
  concerns: [],
  personality: '',
  category: '',
  isDefault: false,
  isActive: true,
};

const categoryOptions = [
  { value: 'Technical', label: 'Technical' },
  { value: 'Business', label: 'Business' },
  { value: 'Procurement', label: 'Procurement' },
  { value: 'Executive', label: 'Executive' },
  { value: 'Compliance', label: 'Compliance' },
];

export default function AdminPersonasPage() {
  const [personas, setPersonas] = useState<BuyerPersonaTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PersonaFormData>(initialFormData);
  const [concernsInput, setConcernsInput] = useState('');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  // Fetch personas
  const fetchPersonas = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getPersonaTemplates({
        page,
        pageSize: 12,
        category: categoryFilter || undefined,
        search: searchTerm || undefined,
      });
      
      if (response.success && response.data) {
        setPersonas(response.data.items);
        setTotalPages(response.data.totalPages);
        setTotal(response.data.total);
      }
    } catch (error) {
      console.error('Failed to fetch personas:', error);
      showToast('Failed to load buyer personas', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonas();
  }, [page, categoryFilter]);

  // Handle search
  const handleSearch = () => {
    setPage(1);
    fetchPersonas();
  };

  // Open form for creating new persona
  const handleCreate = () => {
    setFormData(initialFormData);
    setConcernsInput('');
    setEditingId(null);
    setShowForm(true);
  };

  // Open form for editing persona
  const handleEdit = (persona: BuyerPersonaTemplate) => {
    setFormData({
      name: persona.name,
      role: persona.role,
      company: persona.company,
      background: persona.background,
      concerns: persona.concerns || [],
      personality: persona.personality,
      category: persona.category,
      isDefault: persona.isDefault,
      isActive: persona.isActive,
    });
    setConcernsInput(persona.concerns?.join(', ') || '');
    setEditingId(persona.id);
    setShowForm(true);
  };

  // Save persona
  const handleSave = async () => {
    try {
      setSaving(true);
      
      const dataToSave = {
        ...formData,
        concerns: concernsInput.split(',').map(c => c.trim()).filter(c => c),
      };
      
      if (editingId) {
        await adminApi.updatePersonaTemplate(editingId, dataToSave);
        showToast('Buyer persona updated successfully', 'success');
      } else {
        await adminApi.createPersonaTemplate(dataToSave);
        showToast('Buyer persona created successfully', 'success');
      }
      
      setShowForm(false);
      setEditingId(null);
      setFormData(initialFormData);
      setConcernsInput('');
      fetchPersonas();
    } catch (error) {
      console.error('Failed to save persona:', error);
      showToast('Failed to save buyer persona', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete persona
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this buyer persona?')) {
      return;
    }

    try {
      await adminApi.deletePersonaTemplate(id);
      showToast('Buyer persona deleted successfully', 'success');
      fetchPersonas();
    } catch (error) {
      console.error('Failed to delete persona:', error);
      showToast('Failed to delete buyer persona', 'error');
    }
  };

  // Toggle persona status
  const handleToggleStatus = async (persona: BuyerPersonaTemplate) => {
    try {
      await adminApi.updatePersonaTemplate(persona.id, { 
        isActive: !persona.isActive 
      });
      showToast(`Buyer persona ${persona.isActive ? 'disabled' : 'enabled'} successfully`, 'success');
      fetchPersonas();
    } catch (error) {
      console.error('Failed to toggle persona status:', error);
      showToast('Failed to update buyer persona', 'error');
    }
  };

  // Get category badge color
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'technical':
        return 'bg-blue-100 text-blue-700';
      case 'business':
        return 'bg-green-100 text-green-700';
      case 'procurement':
        return 'bg-purple-100 text-purple-700';
      case 'executive':
        return 'bg-orange-100 text-orange-700';
      case 'compliance':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Buyer Persona Templates</h1>
          <p className="text-gray-500 mt-1">
            Manage reusable buyer personas for roleplay scenarios
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Persona
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, role, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Categories</option>
                {categoryOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <Button variant="outline" size="sm" onClick={handleSearch}>
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Persona Cards */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} className="h-64" />
          ))}
        </div>
      ) : personas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No buyer personas found</p>
            <Button className="mt-4" onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Persona
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {personas.map((persona) => (
              <Card key={persona.id} className={persona.isActive === false ? 'opacity-60' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {persona.name}
                        {persona.isDefault && (
                          <Badge variant="secondary">Default</Badge>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                        <Briefcase className="h-3 w-3" />
                        <span>{persona.role}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(persona.category)}`}>
                      {persona.category}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <Building className="h-3 w-3" />
                    <span>{persona.company}</span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {persona.background}
                  </p>

                  {/* Concerns */}
                  {persona.concerns && persona.concerns.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {persona.concerns.slice(0, 3).map((concern, index) => (
                        <Badge key={index} variant="outline">
                          {concern}
                        </Badge>
                      ))}
                      {persona.concerns.length > 3 && (
                        <Badge variant="outline">
                          +{persona.concerns.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Personality */}
                  <p className="text-xs text-gray-400 italic line-clamp-1 mb-4">
                    {persona.personality}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(persona)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(persona)}
                    >
                      {persona.isActive !== false ? (
                        <ToggleRight className="h-4 w-4 text-success-500" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(persona.id)}
                    >
                      <Trash2 className="h-4 w-4 text-error-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </span>
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
          )}
        </>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{editingId ? 'Edit Buyer Persona' : 'Add Buyer Persona'}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Michael Li"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <Input
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g., CTO"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company *
                  </label>
                  <Input
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g., FinTech Innovations Inc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select category</option>
                    {categoryOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Background *
                </label>
                <textarea
                  value={formData.background}
                  onChange={(e) => setFormData({ ...formData, background: e.target.value })}
                  placeholder="Describe the buyer's professional background..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key Concerns (comma-separated) *
                </label>
                <Input
                  value={concernsInput}
                  onChange={(e) => setConcernsInput(e.target.value)}
                  placeholder="e.g., Data security, Cost reduction, Compliance"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Personality *
                </label>
                <textarea
                  value={formData.personality}
                  onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                  placeholder="Describe the buyer's communication style and personality..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Set as Default Template</span>
                </label>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSave}
                  loading={saving}
                  disabled={!formData.name || !formData.role || !formData.company || !formData.category}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingId ? 'Update' : 'Create'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

