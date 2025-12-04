'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';
import Image from 'next/image';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  onUpload: (file: File) => Promise<string>;
  username: string;
}

export function AvatarUpload({ currentAvatarUrl, onUpload, username }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl || null);
  const [uploading, setUploading] = useState(false);
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

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      console.error('No file selected');
      return;
    }

    console.log('Starting upload for file:', file.name, file.type, file.size);
    setUploading(true);
    try {
      const url = await onUpload(file);
      console.log('Upload successful! URL:', url);
      setPreview(url);
      setFile(null);
      alert('Slika je uspješno učitana!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Greška pri učitavanju slike: ' + (error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-6">
        {/* Avatar Preview */}
        <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          {preview ? (
            <Image
              src={preview}
              alt="Avatar"
              fill
              className="object-cover"
            />
          ) : (
            <span className="text-white text-5xl font-bold">
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
              disabled={uploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              Odaberi Sliku
            </Button>

            {file && (
              <>
                <Button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? 'Učitavanje...' : 'Učitaj'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRemove}
                  disabled={uploading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>

          <p className="text-xs text-gray-500">
            PNG, JPG ili GIF. Max 10MB. Preporučena veličina 400x400px.
          </p>
        </div>
      </div>
    </div>
  );
}
