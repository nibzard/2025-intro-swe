'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  addBannedWord,
  updateBannedWord,
  deleteBannedWord,
  type BannedWord,
  type ModerationSeverity,
  type ModerationCategory,
} from '@/lib/content-moderation';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, Check, X, Shield } from 'lucide-react';

interface ModerationClientProps {
  initialBannedWords: BannedWord[];
}

export function ModerationClient({ initialBannedWords }: ModerationClientProps) {
  const router = useRouter();
  const [bannedWords, setBannedWords] = useState(initialBannedWords);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newWord, setNewWord] = useState({
    word: '',
    severity: 'medium' as ModerationSeverity,
    category: 'profanity' as ModerationCategory,
    action: 'flag' as 'censor' | 'flag' | 'block',
    isRegex: false,
  });

  const handleAddWord = async () => {
    if (!newWord.word.trim()) {
      toast.error('Unesite riječ ili frazu');
      return;
    }

    const loadingToast = toast.loading('Dodajem riječ...');

    const result = await addBannedWord(newWord);

    if (result.success) {
      toast.success('Riječ uspješno dodana!', { id: loadingToast });
      setNewWord({
        word: '',
        severity: 'medium',
        category: 'profanity',
        action: 'flag',
        isRegex: false,
      });
      setIsAdding(false);
      router.refresh();
    } else {
      toast.error(result.error || 'Greška pri dodavanju riječi', { id: loadingToast });
    }
  };

  const handleDeleteWord = async (id: string) => {
    if (!confirm('Jeste li sigurni da želite obrisati ovu riječ?')) {
      return;
    }

    const loadingToast = toast.loading('Brišem riječ...');

    const result = await deleteBannedWord(id);

    if (result.success) {
      toast.success('Riječ uspješno obrisana!', { id: loadingToast });
      setBannedWords(bannedWords.filter((w) => w.id !== id));
    } else {
      toast.error(result.error || 'Greška pri brisanju riječi', { id: loadingToast });
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    const loadingToast = toast.loading(isActive ? 'Deaktiviram...' : 'Aktiviram...');

    const result = await updateBannedWord(id, { isActive: !isActive });

    if (result.success) {
      toast.success(isActive ? 'Riječ deaktivirana!' : 'Riječ aktivirana!', { id: loadingToast });
      setBannedWords(
        bannedWords.map((w) => (w.id === id ? { ...w, isActive: !isActive } : w))
      );
    } else {
      toast.error(result.error || 'Greška pri ažuriranju riječi', { id: loadingToast });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      profanity: 'Psovka',
      hate_speech: 'Govor mržnje',
      harassment: 'Uznemiravanje',
      spam: 'Spam',
      other: 'Ostalo',
    };
    return labels[category] || category;
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      block: 'Blokiraj',
      censor: 'Cenzuriraj',
      flag: 'Označi',
    };
    return labels[action] || action;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Blokirane Riječi i Fraze
          </CardTitle>
          <Button onClick={() => setIsAdding(!isAdding)} size="sm">
            {isAdding ? (
              <>
                <X className="w-4 h-4 mr-2" />
                Odustani
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Dodaj Riječ
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Word Form */}
        {isAdding && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="word">Riječ/Fraza</Label>
                <Input
                  id="word"
                  value={newWord.word}
                  onChange={(e) => setNewWord({ ...newWord, word: e.target.value })}
                  placeholder="npr. kurva, jebem, spam pattern..."
                />
              </div>

              <div>
                <Label htmlFor="severity">Ozbiljnost</Label>
                <select
                  id="severity"
                  value={newWord.severity}
                  onChange={(e) =>
                    setNewWord({ ...newWord, severity: e.target.value as ModerationSeverity })
                  }
                  className="w-full h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                >
                  <option value="low">Niska</option>
                  <option value="medium">Srednja</option>
                  <option value="high">Visoka</option>
                  <option value="critical">Kritična</option>
                </select>
              </div>

              <div>
                <Label htmlFor="category">Kategorija</Label>
                <select
                  id="category"
                  value={newWord.category}
                  onChange={(e) =>
                    setNewWord({ ...newWord, category: e.target.value as ModerationCategory })
                  }
                  className="w-full h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                >
                  <option value="profanity">Psovka</option>
                  <option value="hate_speech">Govor mržnje</option>
                  <option value="harassment">Uznemiravanje</option>
                  <option value="spam">Spam</option>
                  <option value="other">Ostalo</option>
                </select>
              </div>

              <div>
                <Label htmlFor="action">Akcija</Label>
                <select
                  id="action"
                  value={newWord.action}
                  onChange={(e) =>
                    setNewWord({ ...newWord, action: e.target.value as 'censor' | 'flag' | 'block' })
                  }
                  className="w-full h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                >
                  <option value="flag">Označi za pregled</option>
                  <option value="censor">Cenzuriraj (zamijeni sa ***)</option>
                  <option value="block">Blokiraj (zabrani objavu)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isRegex"
                checked={newWord.isRegex}
                onChange={(e) => setNewWord({ ...newWord, isRegex: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <Label htmlFor="isRegex" className="text-sm">
                Koristi regex pattern (napredeno)
              </Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                Odustani
              </Button>
              <Button onClick={handleAddWord}>
                <Plus className="w-4 h-4 mr-2" />
                Dodaj
              </Button>
            </div>
          </div>
        )}

        {/* Banned Words List */}
        <div className="space-y-2">
          {bannedWords.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Nema blokiranih riječi. Dodajte prvu riječ koristeći gumb iznad.
            </p>
          ) : (
            bannedWords.map((word) => (
              <div
                key={word.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  word.isActive
                    ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 opacity-60'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <code className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {word.word}
                    </code>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${getSeverityColor(word.severity)}`}>
                      {word.severity}
                    </span>
                    <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded">
                      {getCategoryLabel(word.category)}
                    </span>
                    <span className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded">
                      {getActionLabel(word.action)}
                    </span>
                    {word.isRegex && (
                      <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                        Regex
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Dodano {new Date(word.createdAt).toLocaleDateString('hr-HR')}
                  </p>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(word.id, word.isActive)}
                    title={word.isActive ? 'Deaktiviraj' : 'Aktiviraj'}
                  >
                    {word.isActive ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-gray-400" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteWord(word.id)}
                    title="Obriši"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold mb-2 text-sm">Kako funkcionira:</h4>
          <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
            <li>• <strong>Blokiraj:</strong> Sprječava objavu sadržaja koji sadrži riječ</li>
            <li>• <strong>Cenzuriraj:</strong> Automatski zamjenjuje riječ sa zvjezdicama (***)</li>
            <li>• <strong>Označi:</strong> Omogućava objavu ali označava za ručni pregled</li>
            <li>• <strong>Regex:</strong> Koristi regex pattern za napredne filtere (npr. "spam.*ovdje")</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
