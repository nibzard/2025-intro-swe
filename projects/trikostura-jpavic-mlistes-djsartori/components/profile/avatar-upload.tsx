'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';
import Image from 'next/image';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  onFileSelect: (file: File | null) => void;
  username: string;
}

export function AvatarUpload({ currentAvatarUrl, onFileSelect, username }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl || null);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.type.startsWith('image/')) {
        alert('Molimo odaberite sliku');
        return;
      }

      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert('Slika ne smije biti veća od 10MB');
        return;
      }

      setFile(selectedFile);
      onFileSelect(selectedFile);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleRemove = () => {
    setPreview(currentAvatarUrl || null);
    setFile(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Avatar Preview */}
        <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
          {preview ? (
            <Image
              src={preview}
              alt="Avatar"
              fill
              className="object-cover object-center"
              sizes="(max-width: 640px) 96px, 128px"
            />
          ) : (
            <span className="text-white text-4xl sm:text-5xl font-bold">
              {username.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex-1 space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="avatar-upload"
          />

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Odaberi Sliku
            </Button>

            {file && (
              <Button
                type="button"
                variant="outline"
                onClick={handleRemove}
              >
                <X className="w-4 h-4 mr-2" />
                Ukloni
              </Button>
            )}
          </div>

          <p className="text-xs text-gray-500">
            PNG, JPG ili GIF. Max 10MB. Slika će se spremiti nakon što kliknete "Spremi Promjene".
          </p>
        </div>
      </div>
    </div>
  );
}
