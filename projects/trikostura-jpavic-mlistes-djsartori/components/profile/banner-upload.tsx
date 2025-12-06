'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';
import Image from 'next/image';

interface BannerUploadProps {
  currentBannerUrl?: string | null;
  onFileSelect: (file: File | null) => void;
  profileColor: string;
}

export function BannerUpload({ currentBannerUrl, onFileSelect, profileColor }: BannerUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentBannerUrl || null);
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

      // Validate file size (max 15MB)
      if (selectedFile.size > 15 * 1024 * 1024) {
        alert('Slika ne smije biti veća od 15MB');
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
    setPreview(currentBannerUrl || null);
    setFile(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Banner Preview */}
      <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-gray-300">
        {preview ? (
          <Image
            src={preview}
            alt="Profile Banner"
            fill
            className="object-cover"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(135deg, ${profileColor} 0%, ${profileColor}dd 100%)`,
            }}
          />
        )}
      </div>

      {/* Upload Controls */}
      <div className="space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id="banner-upload"
        />

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Odaberi Banner
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
          PNG, JPG ili GIF. Max 15MB. Banner će se spremiti nakon što kliknete "Spremi Promjene".
        </p>
      </div>
    </div>
  );
}
