'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Flag } from 'lucide-react';
import { ReportDialog } from './report-dialog';

interface TopicActionsProps {
  topicId: string;
  isAuthor: boolean;
}

export function TopicActions({ topicId, isAuthor }: TopicActionsProps) {
  const [showReportDialog, setShowReportDialog] = useState(false);

  // Don't show report button if user is the author
  if (isAuthor) {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowReportDialog(true)}
        className="text-gray-500 hover:text-red-500"
        title="Prijavi temu"
      >
        <Flag className="w-4 h-4 mr-2" />
        Prijavi
      </Button>

      {showReportDialog && (
        <ReportDialog
          topicId={topicId}
          onClose={() => setShowReportDialog(false)}
        />
      )}
    </>
  );
}
