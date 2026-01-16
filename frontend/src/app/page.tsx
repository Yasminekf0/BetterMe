'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  MessageSquare, 
  BarChart3, 
  Mail, 
  Settings,
  Zap,
  Shield,
  Target,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { ROUTES, APP_NAME } from '@/lib/constants';

const features = [
  {
    icon: MessageSquare,
    title: 'AI Roleplay Engine',
    description: 'Practice realistic sales conversations with AI-powered buyer personas. Handle objections and improve your pitch.',
  },
  {
    icon: BarChart3,
    title: 'Explainable Feedback',
    description: 'Get detailed, evidence-based feedback with direct quotes from your conversation and actionable suggestions.',
  },
  {
    icon: Mail,
    title: 'Email Generator',
    description: 'Generate professional follow-up emails based on your conversation context. Edit and customize before sending.',
  },
  {
    icon: Settings,
    title: 'Scenario Studio',
    description: 'Enablement teams can create and update training scenarios without touching code. Keep content fresh.',
  },
];

const benefits = [
  {
    icon: Zap,
    title: 'Practice Anytime',
    description: 'No need to wait for managers or peers. Practice sales conversations 24/7.',
  },
  {
    icon: Target,
    title: 'Targeted Improvement',
    description: 'Focus on your weak areas with personalized scenario recommendations.',
  },
  {
    icon: Shield,
    title: 'Safe Environment',
    description: 'Make mistakes and learn without risking real customer relationships.',
  },
  {
    icon: Users,
    title: 'Team Insights',
    description: 'Managers can track team readiness and identify coaching opportunities.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="font-semibold text-gray-900">{APP_NAME}</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href={ROUTES.LOGIN}>
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href={ROUTES.REGISTER}>
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-600 text-sm font-medium mb-8">
              <Zap className="h-4 w-4" />
              AI-Powered Sales Training
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              AI That Coaches{' '}
              <span className="text-primary-500">Like a Human</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Transform your sales team from product knowledge to execution readiness. 
              Practice real conversations, get instant feedback, and close more deals.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={ROUTES.REGISTER}>
                <Button size="lg" rightIcon={<ArrowRight className="h-5 w-5" />}>
                  Start Free Trial
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Image Placeholder */}
          <div className="mt-16 max-w-5xl mx-auto">
            <div className="aspect-video rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 shadow-2xl overflow-hidden">
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-10 w-10 text-white" />
                  </div>
                  <p className="text-gray-400 text-lg">Interactive Demo Preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Excel
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A complete platform designed for enterprise sales teams to practice, 
              improve, and execute better conversations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} hover className="border-0 shadow-md">
                  <CardContent className="p-8">
                    <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Sales Teams Love Us
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Knowing your product ≠ Selling it well. We bridge the gap with 
              Practice → Feedback → Execution.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-7 w-7 text-gray-700" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Sales Team?
          </h2>
          <p className="text-lg text-gray-400 mb-8">
            Join leading enterprises using AI to train their sales teams at scale.
          </p>
          <Link href={ROUTES.REGISTER}>
            <Button size="lg" rightIcon={<ArrowRight className="h-5 w-5" />}>
              Get Started for Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="font-semibold text-gray-900">{APP_NAME}</span>
            </div>
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

