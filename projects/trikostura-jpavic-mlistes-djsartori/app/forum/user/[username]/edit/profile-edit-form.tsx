'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { updateProfile } from './actions';

type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  university: string | null;
  study_program: string | null;
};

export function ProfileEditForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const result = await updateProfile(formData);

    if (!result?.success) {
      setError(result?.error || 'Došlo je do greške');
      setLoading(false);
    }
    // If successful, the action will redirect
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="full_name"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Puno Ime <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="full_name"
          name="full_name"
          defaultValue={profile.full_name || ''}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        />
      </div>

      <div>
        <label
          htmlFor="bio"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Biografija
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={profile.bio || ''}
          maxLength={500}
          placeholder="Reci nam nešto o sebi..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Maksimalno 500 znakova
        </p>
      </div>

      <div>
        <label
          htmlFor="university"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Sveučilište
        </label>
        <input
          type="text"
          id="university"
          name="university"
          defaultValue={profile.university || ''}
          placeholder="npr. Sveučilište u Zagrebu"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        />
      </div>

      <div>
        <label
          htmlFor="study_program"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Studijski Program
        </label>
        <input
          type="text"
          id="study_program"
          name="study_program"
          defaultValue={profile.study_program || ''}
          placeholder="npr. Računarstvo"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        />
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Spremanje...' : 'Spremi Promjene'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Odustani
        </Button>
      </div>
    </form>
  );
}
