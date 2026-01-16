'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Copy, 
  Edit2,
  Check,
  Send,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { ROUTES } from '@/lib/constants';
import { copyToClipboard } from '@/lib/utils';
import { useFollowUpEmail } from '@/lib/hooks';

export default function EmailPage() {
  const params = useParams();
  const toast = useToast();
  const sessionId = params.sessionId as string;

  const { 
    data: email, 
    isLoading, 
    isGenerating, 
    isSaving, 
    fetchEmail, 
    generateEmail, 
    updateEmail 
  } = useFollowUpEmail(sessionId);

  const [isEditing, setIsEditing] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const [emailData, setEmailData] = React.useState({
    to: '',
    subject: '',
    body: '',
  });

  // Fetch email on mount
  React.useEffect(() => {
    fetchEmail();
  }, [fetchEmail]);

  // Update local state when email data loads
  React.useEffect(() => {
    if (email) {
      setEmailData({
        to: email.to,
        subject: email.subject,
        body: email.body,
      });
    }
  }, [email]);

  const handleCopy = async () => {
    const fullEmail = `To: ${emailData.to}\nSubject: ${emailData.subject}\n\n${emailData.body}`;
    const success = await copyToClipboard(fullEmail);
    if (success) {
      setCopied(true);
      toast.success('Email copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleSave = async () => {
    const result = await updateEmail({
      to: emailData.to,
      subject: emailData.subject,
      body: emailData.body,
    });
    
    if (result) {
      toast.success('Email saved successfully!');
      setIsEditing(false);
    } else {
      toast.error('Failed to save email');
    }
  };

  const handleRegenerate = async () => {
    const result = await generateEmail();
    if (result) {
      toast.success('Email regenerated!');
    } else {
      toast.error('Failed to regenerate email');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (email) {
      setEmailData({
        to: email.to,
        subject: email.subject,
        body: email.body,
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-5xl space-y-6">
        <Skeleton className="h-6 w-48" />
        <Card>
          <CardContent className="p-6">
            <SkeletonText lines={8} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // No email yet - generate one
  if (!email) {
    return (
      <div className="max-w-5xl space-y-6">
        <Link
          href={ROUTES.FEEDBACK(sessionId)}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Feedback</span>
        </Link>
        
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-4">
              <Send className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate Follow-up Email</h3>
            <p className="text-gray-500 mb-6">
              Create a professional follow-up email based on your conversation.
            </p>
            <Button onClick={handleRegenerate} loading={isGenerating}>
              Generate Email
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      {/* Back Button */}
      <Link
        href={ROUTES.FEEDBACK(sessionId)}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Feedback</span>
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Follow-up Email</h1>
          <p className="text-gray-500 mt-1">
            Generated based on your conversation. Review and customize before sending.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRegenerate}
            loading={isGenerating}
            leftIcon={<RotateCcw className="h-4 w-4" />}
          >
            Regenerate
          </Button>
          <Button
            variant="outline"
            onClick={handleCopy}
            leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          >
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
      </div>

      {/* Email Editor */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Email Content</CardTitle>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              leftIcon={<Edit2 className="h-4 w-4" />}
            >
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* To Field */}
          <div className="space-y-2">
            <label htmlFor="to" className="text-sm font-medium text-gray-700">
              To
            </label>
            <Input
              id="to"
              type="email"
              value={emailData.to}
              onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
              disabled={!isEditing}
              placeholder="recipient@example.com"
            />
          </div>

          {/* Subject Field */}
          <div className="space-y-2">
            <label htmlFor="subject" className="text-sm font-medium text-gray-700">
              Subject
            </label>
            <Input
              id="subject"
              value={emailData.subject}
              onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
              disabled={!isEditing}
            />
          </div>

          {/* Body Field */}
          <div className="space-y-2">
            <label htmlFor="body" className="text-sm font-medium text-gray-700">
              Message
            </label>
            <textarea
              id="body"
              value={emailData.body}
              onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
              disabled={!isEditing}
              className="w-full min-h-[400px] rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-default font-mono"
            />
          </div>

          {/* Actions */}
          {isEditing && (
            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} loading={isSaving}>
                Save Changes
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tips for Follow-up Emails</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-primary-500">✓</span>
              Reference specific points from your conversation to show active listening
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-500">✓</span>
              Address objections raised with concrete solutions or next steps
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-500">✓</span>
              Include a clear call-to-action with specific time options
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-500">✓</span>
              Keep the email concise while being thorough on key points
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-500">✓</span>
              Send within 24 hours of your conversation for best impact
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Send Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          leftIcon={<Send className="h-4 w-4" />}
          onClick={() => {
            handleCopy();
            toast.info('Email copied! Please paste it in your email client to send.');
          }}
        >
          Copy & Send
        </Button>
      </div>
    </div>
  );
}
