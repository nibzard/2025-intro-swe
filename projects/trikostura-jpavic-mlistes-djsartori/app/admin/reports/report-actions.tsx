'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { updateReportStatus } from '@/app/forum/report/actions';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Eye } from 'lucide-react';

interface ReportActionsProps {
  report: {
    id: string;
    status: string;
  };
}

export function ReportActions({ report }: ReportActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const router = useRouter();

  async function handleAction(status: 'reviewed' | 'resolved' | 'dismissed') {
    setIsLoading(true);

    try {
      const result = await updateReportStatus(report.id, status, notes || undefined);

      if (result.success) {
        toast.success('Status prijave azuriran');
        setShowNotes(false);
        setNotes('');
        router.refresh();
      } else {
        toast.error(result.error || 'Doslo je do greske');
      }
    } catch {
      toast.error('Doslo je do greske');
    } finally {
      setIsLoading(false);
    }
  }

  if (report.status === 'resolved' || report.status === 'dismissed') {
    return (
      <span className="text-sm text-gray-500">
        Zavrseno
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {showNotes ? (
        <div className="space-y-2">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Admin biljeske (opcionalno)"
            rows={2}
            className="w-full px-2 py-1 text-sm border rounded"
          />
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowNotes(false)}
              disabled={isLoading}
            >
              Odustani
            </Button>
            <Button
              size="sm"
              onClick={() => handleAction('resolved')}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Rijesi
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction('dismissed')}
              disabled={isLoading}
            >
              <XCircle className="w-3 h-3 mr-1" />
              Odbaci
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-1">
          {report.status === 'pending' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction('reviewed')}
              disabled={isLoading}
            >
              <Eye className="w-3 h-3 mr-1" />
              Pregledaj
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => setShowNotes(true)}
            disabled={isLoading}
          >
            Rijesi
          </Button>
        </div>
      )}
    </div>
  );
}
