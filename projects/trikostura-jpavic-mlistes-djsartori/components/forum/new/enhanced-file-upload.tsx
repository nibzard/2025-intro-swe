'use client';

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload, File, Image as ImageIcon, FileText, AlertCircle } from 'lucide-react';
import { formatFileSize, getFileIcon, ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '@/lib/attachments';
import Image from 'next/image';

interface EnhancedFileUploadProps {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  compact?: boolean;
}

export function EnhancedFileUpload({ files, onChange, maxFiles = 5, compact = false }: EnhancedFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES[file.type as keyof typeof ALLOWED_FILE_TYPES]) {
      return `${file.name}: Tip datoteke nije podržan`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: Prevelika datoteka (max ${MAX_FILE_SIZE / (1024 * 1024)}MB)`;
    }
    return null;
  };

  const handleFiles = useCallback(
    (newFiles: FileList | File[]) => {
      setError('');
      const fileArray = Array.from(newFiles);

      if (files.length + fileArray.length > maxFiles) {
        setError(`Možete priložiti maksimalno ${maxFiles} datoteka`);
        return;
      }

      const validFiles: File[] = [];
      for (const file of fileArray) {
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          return;
        }
        validFiles.push(file);
      }

      if (validFiles.length > 0) {
        onChange([...files, ...validFiles]);
      }
    },
    [files, maxFiles, onChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
        e.target.value = '';
      }
    },
    [handleFiles]
  );

  const removeFile = useCallback(
    (index: number) => {
      onChange(files.filter((_, i) => i !== index));
      setError('');
    },
    [files, onChange]
  );

  const getFilePreview = (file: File) => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            multiple
            accept={Object.values(ALLOWED_FILE_TYPES).join(',')}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={files.length >= maxFiles}
            className="flex-shrink-0"
          >
            <Upload className="w-4 h-4 mr-2" />
            Priloži {files.length > 0 && `(${files.length}/${maxFiles})`}
          </Button>
          {files.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs"
                >
                  <span className="max-w-[100px] truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-gray-500 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-6 transition-all cursor-pointer
          ${isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
            : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
          }
          ${files.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onClick={() => !files.length && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          multiple
          accept={Object.values(ALLOWED_FILE_TYPES).join(',')}
          className="hidden"
          disabled={files.length >= maxFiles}
        />

        <div className="text-center">
          <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400 dark:text-gray-600" />
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
            <span className="font-semibold text-blue-600 dark:text-blue-400">Klikni za odabir</span> ili povuci datoteke
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Maksimalno {maxFiles} datoteka, do {MAX_FILE_SIZE / (1024 * 1024)}MB svaka
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
            PDF, slike, Word, Excel, PowerPoint
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Priložene datoteke ({files.length}/{maxFiles})
            </p>
            {files.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange([])}
                className="h-7 text-xs text-red-600 hover:text-red-700"
              >
                Ukloni sve
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {files.map((file, index) => {
              const preview = getFilePreview(file);
              const fileIcon = getFileIcon(file.type);

              return (
                <div
                  key={index}
                  className="group relative flex items-center gap-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {/* Icon or Preview */}
                  <div className="flex-shrink-0">
                    {preview ? (
                      <div className="relative w-12 h-12 rounded overflow-hidden">
                        <Image src={preview} alt={file.name} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded">
                        <span className="text-2xl">{fileIcon}</span>
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title="Ukloni datoteku"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
