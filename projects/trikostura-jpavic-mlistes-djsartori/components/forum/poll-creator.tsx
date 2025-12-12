'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

interface PollCreatorProps {
  topicId: string;
  onPollCreated?: (pollId: string) => void;
  onCancel?: () => void;
}

export function PollCreator({ topicId, onPollCreated, onCancel }: PollCreatorProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [hasExpiration, setHasExpiration] = useState(false);
  const [expirationDays, setExpirationDays] = useState(7);
  const [isOpen, setIsOpen] = useState(false);

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    } else {
      toast.error('Maksimalno 10 opcija');
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    } else {
      toast.error('Potrebne su minimalno 2 opcije');
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!question.trim()) {
      toast.error('Pitanje je obavezno');
      return;
    }

    const validOptions = options.filter((opt) => opt.trim());
    if (validOptions.length < 2) {
      toast.error('Potrebne su minimalno 2 opcije');
      return;
    }

    const expiresAt = hasExpiration
      ? new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000)
      : undefined;

    // Import action dynamically to avoid bundling on every page
    const { createPoll } = await import('@/app/forum/polls/actions');

    const result = await createPoll({
      topicId,
      question: question.trim(),
      options: validOptions,
      allowMultipleChoices: allowMultiple,
      expiresAt,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Anketa kreirana!');
      onPollCreated?.(result.pollId!);
    }
  };

  // If not open, show just a button
  if (!isOpen) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="p-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(true)}
            className="w-full gap-2"
          >
            <BarChart3 className="w-5 h-5" />
            Kreiraj anketu za ovu temu
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Kreiraj anketu
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Question */}
          <div className="space-y-2">
            <Label htmlFor="poll-question">Pitanje *</Label>
            <Input
              id="poll-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Koje teme bi trebali pokriti sljedeći?"
              maxLength={200}
              required
            />
            <p className="text-xs text-gray-500">{question.length}/200</p>
          </div>

          {/* Options */}
          <div className="space-y-2">
            <Label>Opcije *</Label>
            {options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Opcija ${index + 1}`}
                  maxLength={100}
                  required
                />
                {options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}

            {options.length < 10 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Dodaj opciju
              </Button>
            )}
          </div>

          {/* Settings */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="allow-multiple"
                checked={allowMultiple}
                onChange={(e) => setAllowMultiple(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="allow-multiple" className="cursor-pointer font-normal">
                Dozvoli više odgovora
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="has-expiration"
                checked={hasExpiration}
                onChange={(e) => setHasExpiration(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="has-expiration" className="cursor-pointer font-normal">
                Postavi rok isteka
              </Label>
            </div>

            {hasExpiration && (
              <div className="ml-6 flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={expirationDays}
                  onChange={(e) => setExpirationDays(parseInt(e.target.value) || 7)}
                  className="w-20"
                />
                <Label className="font-normal">dana</Label>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1">
              Kreiraj anketu
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsOpen(false);
                onCancel?.();
              }}
            >
              Odustani
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
