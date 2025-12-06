'use client';

import { useState } from 'react';
import { Download, X, Play, FileText, Image as ImageIcon, Film, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageLightbox } from './image-lightbox';
import {
  formatFileSize,
  getFileIcon,
  isImage,
  isVideo,
  isAudio,
  isPDF,
} from '@/lib/attachments';

export interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
}

interface AdvancedAttachmentListProps {
  attachments: Attachment[];
  canDelete?: boolean;
  onDelete?: (attachmentId: string) => void;
}

export function AdvancedAttachmentList({
  attachments,
  canDelete = false,
  onDelete,
}: AdvancedAttachmentListProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [expandedPDF, setExpandedPDF] = useState<string | null>(null);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  // Group attachments by type
  const images = attachments.filter((att) => isImage(att.file_type));
  const videos = attachments.filter((att) => isVideo(att.file_type));
  const audios = attachments.filter((att) => isAudio(att.file_type));
  const pdfs = attachments.filter((att) => isPDF(att.file_type));
  const others = attachments.filter(
    (att) =>
      !isImage(att.file_type) &&
      !isVideo(att.file_type) &&
      !isAudio(att.file_type) &&
      !isPDF(att.file_type)
  );

  const handleDownload = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <ImageIcon className="w-4 h-4" />
            <span>Slike ({images.length})</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((attachment, index) => (
              <div
                key={attachment.id}
                className="relative group aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-all"
                onClick={() => openLightbox(index)}
              >
                <img
                  src={attachment.file_url}
                  alt={attachment.file_name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent text-white text-xs p-2 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                  {attachment.file_name}
                </div>
                {canDelete && onDelete && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(attachment.id);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Videos */}
      {videos.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Film className="w-4 h-4" />
            <span>Video ({videos.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {videos.map((attachment) => (
              <div
                key={attachment.id}
                className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                <video
                  controls
                  className="w-full"
                  preload="metadata"
                >
                  <source src={attachment.file_url} type={attachment.file_type} />
                  Your browser doesn't support video playback.
                </video>
                <div className="p-2 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(attachment.file_size)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(attachment.file_url, attachment.file_name)}
                      title="Preuzmi"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    {canDelete && onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(attachment.id)}
                        title="Obriši"
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audio */}
      {audios.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Music className="w-4 h-4" />
            <span>Audio ({audios.length})</span>
          </div>
          <div className="space-y-2">
            {audios.map((attachment) => (
              <div
                key={attachment.id}
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Music className="w-5 h-5 text-purple-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(attachment.file_size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(attachment.file_url, attachment.file_name)}
                      title="Preuzmi"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    {canDelete && onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(attachment.id)}
                        title="Obriši"
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
                <audio controls className="w-full">
                  <source src={attachment.file_url} type={attachment.file_type} />
                  Your browser doesn't support audio playback.
                </audio>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PDFs */}
      {pdfs.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <FileText className="w-4 h-4" />
            <span>PDF Dokumenti ({pdfs.length})</span>
          </div>
          <div className="space-y-2">
            {pdfs.map((attachment) => (
              <div
                key={attachment.id}
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="w-5 h-5 text-red-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(attachment.file_size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setExpandedPDF(
                          expandedPDF === attachment.id ? null : attachment.id
                        )
                      }
                    >
                      {expandedPDF === attachment.id ? 'Sakrij' : 'Prikaži'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(attachment.file_url, attachment.file_name)}
                      title="Preuzmi"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    {canDelete && onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(attachment.id)}
                        title="Obriši"
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
                {expandedPDF === attachment.id && (
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    <iframe
                      src={attachment.file_url}
                      className="w-full h-96"
                      title={attachment.file_name}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Files */}
      {others.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Ostali dokumenti ({others.length})
          </p>
          <div className="space-y-2">
            {others.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-3 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-2xl">{getFileIcon(attachment.file_type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(attachment.file_size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(attachment.file_url, attachment.file_name)}
                    title="Preuzmi"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  {canDelete && onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(attachment.id)}
                      title="Obriši"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {lightboxOpen && images.length > 0 && (
        <ImageLightbox
          images={images.map((img) => ({ url: img.file_url, name: img.file_name }))}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
