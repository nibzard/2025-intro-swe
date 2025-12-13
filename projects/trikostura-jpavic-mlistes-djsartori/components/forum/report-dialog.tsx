'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flag, X } from 'lucide-react';
import { submitReport } from '@/app/forum/report/actions';
import { toast } from 'sonner';

interface ReportDialogProps {
  topicId?: string;
  replyId?: string;
  onClose: () => void;
}

const REPORT_TYPES = [
  { value: 'spam', label: 'Spam', description: 'Nezeljena reklama ili ponavljajuci sadrzaj' },
  { value: 'harassment', label: 'Uznemiravanje', description: 'Uvrede, prijetnje ili zlostavljanje' },
  { value: 'inappropriate', label: 'Neprikladan sadrzaj', description: 'Eksplicitan ili uvredljiv sadrzaj' },
  { value: 'misinformation', label: 'Dezinformacije', description: 'Lazne ili obmanjujuce informacije' },
  { value: 'other', label: 'Ostalo', description: 'Drugi razlog' },
];

export function ReportDialog({ topicId, replyId, onClose }: ReportDialogProps) {
  const [selectedType, setSelectedType] = useState<string>('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedType) {
      toast.error('Odaberite razlog prijave');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      if (topicId) formData.append('topicId', topicId);
      if (replyId) formData.append('replyId', replyId);
      formData.append('reportType', selectedType);
      if (description) formData.append('description', description);

      const result = await submitReport(formData);

      if (result.success) {
        toast.success('Prijava uspjesno poslana. Hvala vam!');
        onClose();
      } else {
        toast.error(result.error || 'Doslo je do greske');
      }
    } catch {
      toast.error('Doslo je do greske');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-500" />
            Prijavi sadrzaj
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Razlog prijave *
              </label>
              <div className="space-y-2">
                {REPORT_TYPES.map((type) => (
                  <label
                    key={type.value}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedType === type.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportType"
                      value={type.value}
                      checked={selectedType === type.value}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-sm">{type.label}</div>
                      <div className="text-xs text-gray-500">{type.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Dodatni opis (opcionalno)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Opisite problem detaljnije..."
                rows={3}
                maxLength={1000}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="text-xs text-gray-400 mt-1 text-right">
                {description.length}/1000
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Odustani
              </Button>
              <Button type="submit" disabled={isSubmitting || !selectedType}>
                {isSubmitting ? 'Slanje...' : 'Posalji prijavu'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
