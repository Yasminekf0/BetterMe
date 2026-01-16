'use client';

import React from 'react';
import Link from 'next/link';
import { Search, Filter, Play, Clock, Users, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ROUTES, SCENARIO_CATEGORIES, DIFFICULTY_LABELS } from '@/lib/constants';
import { cn, getDifficultyColor } from '@/lib/utils';
import { useScenarios } from '@/lib/hooks';

const categories = ['All', ...SCENARIO_CATEGORIES.map(c => c.label)];
const difficulties = ['All', 'Easy', 'Medium', 'Hard'];

export default function ScenariosPage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = React.useState('All');
  const [showFilters, setShowFilters] = React.useState(false);
  const [debouncedSearch, setDebouncedSearch] = React.useState('');

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch scenarios with filters
  const { data: scenarios, isLoading, refetch } = useScenarios({
    search: debouncedSearch || undefined,
    category: selectedCategory !== 'All' ? selectedCategory : undefined,
    difficulty: selectedDifficulty !== 'All' ? selectedDifficulty.toLowerCase() : undefined,
  });

  // Client-side filtering as backup
  const filteredScenarios = React.useMemo(() => {
    return scenarios.filter((scenario) => {
      const matchesSearch = !debouncedSearch || 
        scenario.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        scenario.description.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || scenario.category === selectedCategory;
      const matchesDifficulty = selectedDifficulty === 'All' || 
        scenario.difficulty === selectedDifficulty.toLowerCase();
      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  }, [scenarios, debouncedSearch, selectedCategory, selectedDifficulty]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedDifficulty('All');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Scenario Center</h1>
        <p className="text-gray-500 mt-1">
          Choose a scenario to practice your sales skills
        </p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
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
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={<Filter className="h-4 w-4" />}
          >
            Filters
          </Button>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                selectedCategory === category
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-xl animate-in">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty
              </label>
              <div className="flex gap-2">
                {difficulties.map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setSelectedDifficulty(diff)}
                    className={cn(
                      'px-3 py-1 rounded-lg text-sm transition-colors',
                      selectedDifficulty === diff
                        ? 'bg-gray-900 text-white'
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                    )}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <p className="text-sm text-gray-500">
        {isLoading ? 'Loading...' : `Showing ${filteredScenarios.length} scenario${filteredScenarios.length !== 1 ? 's' : ''}`}
      </p>

      {/* Scenario Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredScenarios.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScenarios.map((scenario) => (
            <Card key={scenario.id} hover className="flex flex-col">
              <CardContent className="p-5 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <Badge className={getDifficultyColor(scenario.difficulty)}>
                    {DIFFICULTY_LABELS[scenario.difficulty]}
                  </Badge>
                  {scenario.myBestScore && (
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 text-warning-500 fill-warning-500" />
                      <span className="font-medium text-gray-900">{scenario.myBestScore}</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <h3 className="font-semibold text-gray-900 mb-2">
                  {scenario.title}
                </h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-1">
                  {scenario.description}
                </p>

                {/* Buyer Info */}
                <div className="flex items-center gap-2 mb-4 p-2 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-600 font-medium text-sm">
                      {scenario.buyerPersona.name.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {scenario.buyerPersona.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {scenario.buyerPersona.role}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{scenario.estimatedDuration} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    <span>{scenario.practiceCount} practices</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5" />
                    <span>Avg {scenario.averageScore}</span>
                  </div>
                </div>

                {/* Action */}
                <Link href={ROUTES.SCENARIO_DETAIL(scenario.id)} className="block">
                  <Button className="w-full" leftIcon={<Play className="h-4 w-4" />}>
                    Start Practice
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No scenarios found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
          <Button variant="outline" onClick={handleClearFilters}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
