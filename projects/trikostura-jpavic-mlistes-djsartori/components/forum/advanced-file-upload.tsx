'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, X, Upload, Image as ImageIcon, Check, Loader2 } from 'lucide-react';
import { formatFileSize, getFileIcon, ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '@/lib/attachments';
import { compressImage, generateThumbnail } from '@/lib/image-compression';

interface FileWithPreview {
  file: File;
  preview?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  id: string;
}

interface AdvancedFileUploadProps {
  onFilesChange: (files: File[]) => void;
  onUploadProgress?: (fileId: string, progress: number) => void;
  maxFiles?: number;
  acceptImages?: boolean;
}

export function AdvancedFileUpload({
  onFilesChange,
  onUploadProgress,
  maxFiles = 5,
  acceptImages = true,
}: AdvancedFileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Handle paste from clipboard
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            files.push(file);
          }
        }
      }

      if (files.length > 0) {
        e.preventDefault();
        await handleFiles(files);
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [selectedFiles]);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!ALLOWED_FILE_TYPES[file.type as keyof typeof ALLOWED_FILE_TYPES]) {
      return `${file.name}: Tip datoteke nije podržan`;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: Datoteka je prevelika (max ${MAX_FILE_SIZE / (1024 * 1024)}MB)`;
    }

    return null;
  };

  const processFile = async (file: File): Promise<FileWithPreview> => {
    const id = Math.random().toString(36).substring(7);

    // Compress image if needed
    let processedFile = file;
    if (file.type.startsWith('image/')) {
      try {
        processedFile = await compressImage(file, 2);
      } catch (err) {
        console.error('Image compression failed:', err);
      }
    }

    // Generate preview for images
    let preview: string | undefined;
    if (file.type.startsWith('image/')) {
      try {
        preview = await generateThumbnail(file);
      } catch (err) {
        console.error('Thumbnail generation failed:', err);
      }
    }

    return {
      file: processedFile,
      preview,
      progress: 0,
      status: 'pending',
      id,
    };
  };

  const handleFiles = async (files: File[]) => {
    setError('');

    // Check total number of files
    if (selectedFiles.length + files.length > maxFiles) {
      setError(`Možete priložiti maksimalno ${maxFiles} datoteka`);
      return;
    }

    setIsProcessing(true);

    const newFiles: FileWithPreview[] = [];
    for (const file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        continue;
      }

      const fileWithPreview = await processFile(file);
      newFiles.push(fileWithPreview);
    }

    if (newFiles.length > 0) {
      const updatedFiles = [...selectedFiles, ...newFiles];
      setSelectedFiles(updatedFiles);
      onFilesChange(updatedFiles.map((f) => f.file));
    }

    setIsProcessing(false);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await handleFiles(files);
  };

  const removeFile = (id: string) => {
    const newFiles = selectedFiles.filter((f) => f.id !== id);
    setSelectedFiles(newFiles);
    onFilesChange(newFiles.map((f) => f.file));
    setError('');
  };

  const moveFile = (id: string, direction: 'up' | 'down') => {
    const index = selectedFiles.findIndex((f) => f.id === id);
    if (index === -1) return;

    const newFiles = [...selectedFiles];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= newFiles.length) return;

    [newFiles[index], newFiles[newIndex]] = [newFiles[newIndex], newFiles[index]];
    setSelectedFiles(newFiles);
    onFilesChange(newFiles.map((f) => f.file));
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only set to false if leaving the drop zone
    if (e.target === dropZoneRef.current) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    await handleFiles(files);
  };

  // Group files by type
  const groupedFiles = selectedFiles.reduce(
    (acc, file) => {
      if (file.file.type.startsWith('image/')) {
        acc.images.push(file);
      } else {
        acc.others.push(file);
      }
      return acc;
    },
    { images: [] as FileWithPreview[], others: [] as FileWithPreview[] }
  );

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        ref={dropZoneRef}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        } ${isProcessing ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          multiple
          accept={Object.values(ALLOWED_FILE_TYPES).join(',')}
          className="hidden"
          disabled={isProcessing || selectedFiles.length >= maxFiles}
        />

        <div className="text-center">
          {isProcessing ? (
            <>
              <Loader2 className="w-12 h-12 mx-auto text-gray-400 animate-spin mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Obrada datoteka...
              </p>
            </>
          ) : isDragging ? (
            <>
              <Upload className="w-12 h-12 mx-auto text-blue-500 mb-3" />
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Ispusti datoteke ovdje
              </p>
            </>
          ) : (
            <>
              <Paperclip className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Klikni ili povuci datoteke ovdje
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Ili pritisni Ctrl+V za paste iz clipboard-a
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Max {maxFiles} datoteka, do {MAX_FILE_SIZE / (1024 * 1024)}MB svaka
              </p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-2">
          {error}
        </div>
      )}

      {/* Image Gallery */}
      {groupedFiles.images.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Slike ({groupedFiles.images.length})
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {groupedFiles.images.map((fileItem, index) => (
              <div
                key={fileItem.id}
                className="relative group aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                {fileItem.preview && (
                  <img
                    src={fileItem.preview}
                    alt={fileItem.file.name}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center gap-1">
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveFile(fileItem.id, 'up');
                      }}
                    >
                      ←
                    </Button>
                  )}
                  {index < groupedFiles.images.length - 1 && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveFile(fileItem.id, 'down');
                      }}
                    >
                      →
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(fileItem.id);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 truncate">
                  {fileItem.file.name}
                </div>
                <div className="absolute top-1 right-1 text-xs bg-black bg-opacity-60 text-white px-1 rounded">
                  {formatFileSize(fileItem.file.size)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Files */}
      {groupedFiles.others.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Dokumenti ({groupedFiles.others.length})</p>
          <div className="space-y-2">
            {groupedFiles.others.map((fileItem) => (
              <div
                key={fileItem.id}
                className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-3 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-2xl">{getFileIcon(fileItem.file.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{fileItem.file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(fileItem.file.size)}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(fileItem.id)}
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
