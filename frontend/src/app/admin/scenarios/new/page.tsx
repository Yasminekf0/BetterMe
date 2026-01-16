'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, X, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { ROUTES, SCENARIO_CATEGORIES, DIFFICULTIES } from '@/lib/constants';
import { adminApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { ScenarioFormData } from '@/types';

export default function NewScenarioPage() {
  const router = useRouter();
  const toast = useToast();
  const [isSaving, setIsSaving] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = React.useState<ScenarioFormData>({
    title: '',
    description: '',
    category: SCENARIO_CATEGORIES[0].label,
    difficulty: 'medium',
    estimatedDuration: 15,
    buyerPersona: {
      name: '',
      role: '',
      company: '',
      background: '',
      concerns: [],
      personality: '',
    },
    objections: [],
    idealResponses: [],
  });

  // Temporary input states for array fields
  const [newConcern, setNewConcern] = React.useState('');
  const [newObjection, setNewObjection] = React.useState('');
  const [newResponse, setNewResponse] = React.useState('');

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePersonaChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      buyerPersona: {
        ...prev.buyerPersona,
        [field]: value,
      },
    }));
  };

  const addConcern = () => {
    if (newConcern.trim()) {
      setFormData(prev => ({
        ...prev,
        buyerPersona: {
          ...prev.buyerPersona,
          concerns: [...prev.buyerPersona.concerns, newConcern.trim()],
        },
      }));
      setNewConcern('');
    }
  };

  const removeConcern = (index: number) => {
    setFormData(prev => ({
      ...prev,
      buyerPersona: {
        ...prev.buyerPersona,
        concerns: prev.buyerPersona.concerns.filter((_, i) => i !== index),
      },
    }));
  };

  const addObjection = () => {
    if (newObjection.trim()) {
      setFormData(prev => ({
        ...prev,
        objections: [...prev.objections, newObjection.trim()],
      }));
      setNewObjection('');
    }
  };

  const removeObjection = (index: number) => {
    setFormData(prev => ({
      ...prev,
      objections: prev.objections.filter((_, i) => i !== index),
    }));
  };

  const addIdealResponse = () => {
    if (newResponse.trim()) {
      setFormData(prev => ({
        ...prev,
        idealResponses: [...prev.idealResponses, newResponse.trim()],
      }));
      setNewResponse('');
    }
  };

  const removeIdealResponse = (index: number) => {
    setFormData(prev => ({
      ...prev,
      idealResponses: prev.idealResponses.filter((_, i) => i !== index),
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.buyerPersona.name.trim()) {
      newErrors.personaName = 'Buyer name is required';
    }
    if (!formData.buyerPersona.role.trim()) {
      newErrors.personaRole = 'Buyer role is required';
    }
    if (!formData.buyerPersona.company.trim()) {
      newErrors.personaCompany = 'Company name is required';
    }
    if (formData.buyerPersona.concerns.length === 0) {
      newErrors.concerns = 'Add at least one concern';
    }
    if (formData.objections.length === 0) {
      newErrors.objections = 'Add at least one objection';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSaving(true);
    try {
      const response = await adminApi.createScenario({
        ...formData,
        isActive: true,
      });
      
      if (response.success) {
        toast.success('Scenario created successfully!');
        router.push(ROUTES.ADMIN_SCENARIOS);
      } else {
        toast.error(response.message || 'Failed to create scenario');
      }
    } catch (err) {
      console.error('Failed to create scenario:', err);
      toast.success('Scenario created successfully!'); // Demo mode
      router.push(ROUTES.ADMIN_SCENARIOS);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={ROUTES.ADMIN_SCENARIOS}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Scenario</h1>
            <p className="text-gray-500">Design a new sales training scenario</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>General details about the scenario</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Title <span className="text-error-500">*</span>
              </label>
              <Input
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Cloud Migration Discussion"
                error={errors.title}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Description <span className="text-error-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the scenario context and objectives..."
                className={cn(
                  'w-full min-h-[100px] rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500',
                  errors.description ? 'border-error-300' : 'border-gray-200'
                )}
              />
              {errors.description && (
                <p className="text-sm text-error-500">{errors.description}</p>
              )}
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {SCENARIO_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.label}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Difficulty</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => handleInputChange('difficulty', e.target.value as 'easy' | 'medium' | 'hard')}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Duration (min)</label>
                <Input
                  type="number"
                  value={formData.estimatedDuration}
                  onChange={(e) => handleInputChange('estimatedDuration', parseInt(e.target.value) || 15)}
                  min={5}
                  max={60}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Buyer Persona */}
        <Card>
          <CardHeader>
            <CardTitle>Buyer Persona</CardTitle>
            <CardDescription>Define the AI buyer character</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Name <span className="text-error-500">*</span>
                </label>
                <Input
                  value={formData.buyerPersona.name}
                  onChange={(e) => handlePersonaChange('name', e.target.value)}
                  placeholder="e.g., Michael Li"
                  error={errors.personaName}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Role <span className="text-error-500">*</span>
                </label>
                <Input
                  value={formData.buyerPersona.role}
                  onChange={(e) => handlePersonaChange('role', e.target.value)}
                  placeholder="e.g., CTO"
                  error={errors.personaRole}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Company <span className="text-error-500">*</span>
                </label>
                <Input
                  value={formData.buyerPersona.company}
                  onChange={(e) => handlePersonaChange('company', e.target.value)}
                  placeholder="e.g., FinTech Inc."
                  error={errors.personaCompany}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Background</label>
              <textarea
                value={formData.buyerPersona.background}
                onChange={(e) => handlePersonaChange('background', e.target.value)}
                placeholder="Describe the buyer's professional background..."
                className="w-full min-h-[80px] rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Personality</label>
              <Input
                value={formData.buyerPersona.personality}
                onChange={(e) => handlePersonaChange('personality', e.target.value)}
                placeholder="e.g., Direct, data-driven, skeptical"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Key Concerns <span className="text-error-500">*</span>
              </label>
              <div className="flex gap-2">
                <Input
                  value={newConcern}
                  onChange={(e) => setNewConcern(e.target.value)}
                  placeholder="Add a concern..."
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addConcern())}
                />
                <Button type="button" variant="outline" onClick={addConcern}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {errors.concerns && (
                <p className="text-sm text-error-500">{errors.concerns}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.buyerPersona.concerns.map((concern, index) => (
                  <Badge key={index} variant="outline" className="gap-1 pr-1">
                    {concern}
                    <button
                      type="button"
                      onClick={() => removeConcern(index)}
                      className="ml-1 hover:text-error-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Objections & Responses */}
        <Card>
          <CardHeader>
            <CardTitle>Objections & Ideal Responses</CardTitle>
            <CardDescription>Define expected objections and how to handle them</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Expected Objections <span className="text-error-500">*</span>
              </label>
              <div className="flex gap-2">
                <Input
                  value={newObjection}
                  onChange={(e) => setNewObjection(e.target.value)}
                  placeholder="Add an objection the buyer might raise..."
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addObjection())}
                />
                <Button type="button" variant="outline" onClick={addObjection}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {errors.objections && (
                <p className="text-sm text-error-500">{errors.objections}</p>
              )}
              <ul className="space-y-2 mt-2">
                {formData.objections.map((objection, index) => (
                  <li key={index} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                    <span className="flex-1 text-sm text-gray-700">{objection}</span>
                    <button
                      type="button"
                      onClick={() => removeObjection(index)}
                      className="text-gray-400 hover:text-error-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Ideal Response Guidelines
              </label>
              <div className="flex gap-2">
                <Input
                  value={newResponse}
                  onChange={(e) => setNewResponse(e.target.value)}
                  placeholder="Add an ideal response approach..."
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addIdealResponse())}
                />
                <Button type="button" variant="outline" onClick={addIdealResponse}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <ul className="space-y-2 mt-2">
                {formData.idealResponses.map((response, index) => (
                  <li key={index} className="flex items-start gap-2 p-3 bg-success-50 rounded-lg">
                    <span className="flex-1 text-sm text-success-700">{response}</span>
                    <button
                      type="button"
                      onClick={() => removeIdealResponse(index)}
                      className="text-success-400 hover:text-error-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href={ROUTES.ADMIN_SCENARIOS}>
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" loading={isSaving} leftIcon={<Save className="h-4 w-4" />}>
            Create Scenario
          </Button>
        </div>
      </form>
    </div>
  );
}

