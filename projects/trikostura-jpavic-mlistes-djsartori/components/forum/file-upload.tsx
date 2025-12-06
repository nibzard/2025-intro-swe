'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, X, Upload } from 'lucide-react';
import { formatFileSize, getFileIcon, ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '@/lib/attachments';

interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
}

export function FileUpload({ onFilesChange, maxFiles = 5 }: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setError('');

    // Check total number of files
    if (selectedFiles.length + files.length > maxFiles) {
      setError(`Možete priložiti maksimalno ${maxFiles} datoteka`);
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    for (const file of files) {
      // Check file type
      if (!ALLOWED_FILE_TYPES[file.type as keyof typeof ALLOWED_FILE_TYPES]) {
        setError(`${file.name}: Tip datoteke nije podržan`);
        continue;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        setError(`${file.name}: Datoteka je prevelika (max ${MAX_FILE_SIZE / (1024 * 1024)}MB)`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      const newFiles = [...selectedFiles, ...validFiles];
      setSelectedFiles(newFiles);
      onFilesChange(newFiles);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesChange(newFiles);
    setError('');
  };

  return (
    <div className="space-y-3">
      <div>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          multiple
          accept={Object.values(ALLOWED_FILE_TYPES).join(',')}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            disabled={selectedFiles.length >= maxFiles}
          >
            <Paperclip className="w-4 h-4 mr-2" />
            Priloži datoteku
          </Button>
        </label>
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-3">
          Max {maxFiles} datoteka, do {MAX_FILE_SIZE / (1024 * 1024)}MB svaka
        </span>
      </div>

      {error && (
        <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-2">
          {error}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Priložene datoteke:</p>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xl">{getFileIcon(file.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
