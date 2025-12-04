'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { updateProfile, uploadProfileImage } from './actions';
import { AvatarUpload } from '@/components/profile/avatar-upload';
import { BannerUpload } from '@/components/profile/banner-upload';
import { Github, Linkedin, Globe, Twitter } from 'lucide-react';

type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  university: string | null;
  study_program: string | null;
  avatar_url: string | null;
  profile_banner_url: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  twitter_url: string | null;
  year_of_study: number | null;
  graduation_year: number | null;
  academic_interests: string | null;
  skills: string | null;
  profile_color: string;
};

export function ProfileEditForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [bannerUrl, setBannerUrl] = useState(profile.profile_banner_url);
  const [profileColor, setProfileColor] = useState(profile.profile_color || '#3B82F6');

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    // Add avatar and banner URLs to form data
    if (avatarUrl) formData.set('avatar_url', avatarUrl);
    if (bannerUrl) formData.set('profile_banner_url', bannerUrl);

    const result = await updateProfile(formData);

    if (!result?.success) {
      setError(result?.error || 'Došlo je do greške');
      setLoading(false);
    }
    // If successful, the action will redirect
  }

  async function handleAvatarUpload(file: File): Promise<string> {
    console.log('handleAvatarUpload called with file:', file.name);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'avatar');

    console.log('Calling uploadProfileImage action...');
    const result = await uploadProfileImage(formData);
    console.log('uploadProfileImage result:', result);

    if (result.success && result.url) {
      console.log('Upload successful, setting avatar URL:', result.url);
      setAvatarUrl(result.url);
      return result.url;
    }
    console.error('Upload failed:', result.error);
    throw new Error(result.error || 'Upload failed');
  }

  async function handleBannerUpload(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'banner');

    const result = await uploadProfileImage(formData);
    if (result.success && result.url) {
      setBannerUrl(result.url);
      return result.url;
    }
    throw new Error(result.error || 'Upload failed');
  }

  return (
    <form action={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Avatar Upload */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Profilna Slika</h3>
        <AvatarUpload
          currentAvatarUrl={avatarUrl}
          onUpload={handleAvatarUpload}
          username={profile.username}
        />
      </div>

      {/* Banner Upload */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Banner</h3>
        <BannerUpload
          currentBannerUrl={bannerUrl}
          onUpload={handleBannerUpload}
          profileColor={profileColor}
        />
      </div>

      {/* Profile Color */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Tema Profila</h3>
        <label
          htmlFor="profile_color"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Boja Profila
        </label>
        <div className="flex gap-4 items-center">
          <input
            type="color"
            id="profile_color"
            name="profile_color"
            value={profileColor}
            onChange={(e) => setProfileColor(e.target.value)}
            className="h-12 w-20 rounded cursor-pointer"
          />
          <input
            type="text"
            value={profileColor}
            onChange={(e) => setProfileColor(e.target.value)}
            placeholder="#3B82F6"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Basic Info */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Osnovne Informacije</h3>
        <div className="space-y-4">
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
        </div>
      </div>

      {/* Academic Info */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Akademske Informacije</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="year_of_study"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Godina Studija
              </label>
              <input
                type="number"
                id="year_of_study"
                name="year_of_study"
                defaultValue={profile.year_of_study || ''}
                min="1"
                max="10"
                placeholder="1-10"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="graduation_year"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Godina Završetka
              </label>
              <input
                type="number"
                id="graduation_year"
                name="graduation_year"
                defaultValue={profile.graduation_year || ''}
                min="1900"
                max="2100"
                placeholder="2024"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="academic_interests"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Akademski Interesi
            </label>
            <textarea
              id="academic_interests"
              name="academic_interests"
              rows={3}
              defaultValue={profile.academic_interests || ''}
              maxLength={500}
              placeholder="Područja koja te zanimaju..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
            />
          </div>

          <div>
            <label
              htmlFor="skills"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Vještine i Tehnologije
            </label>
            <textarea
              id="skills"
              name="skills"
              rows={3}
              defaultValue={profile.skills || ''}
              maxLength={1000}
              placeholder="JavaScript, Python, React, Node.js..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Odvojeno zarezima
            </p>
          </div>
        </div>
      </div>

      {/* Social Media Links */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Društvene Mreže & Portfolio</h3>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="github_url"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              <Github className="w-4 h-4 inline mr-2" />
              GitHub
            </label>
            <input
              type="url"
              id="github_url"
              name="github_url"
              defaultValue={profile.github_url || ''}
              placeholder="https://github.com/username"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="linkedin_url"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              <Linkedin className="w-4 h-4 inline mr-2" />
              LinkedIn
            </label>
            <input
              type="url"
              id="linkedin_url"
              name="linkedin_url"
              defaultValue={profile.linkedin_url || ''}
              placeholder="https://linkedin.com/in/username"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="website_url"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              <Globe className="w-4 h-4 inline mr-2" />
              Website / Portfolio
            </label>
            <input
              type="url"
              id="website_url"
              name="website_url"
              defaultValue={profile.website_url || ''}
              placeholder="https://yourwebsite.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="twitter_url"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              <Twitter className="w-4 h-4 inline mr-2" />
              Twitter / X
            </label>
            <input
              type="url"
              id="twitter_url"
              name="twitter_url"
              defaultValue={profile.twitter_url || ''}
              placeholder="https://twitter.com/username"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-6 border-t">
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
