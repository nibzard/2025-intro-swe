'use client';

import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatFileSize, getFileIcon } from '@/lib/attachments';

export interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
}

interface AttachmentListProps {
  attachments: Attachment[];
  canDelete?: boolean;
  onDelete?: (attachmentId: string) => void;
}

export function AttachmentList({ attachments, canDelete = false, onDelete }: AttachmentListProps) {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  const handleDownload = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isImage = (fileType: string) => fileType.startsWith('image/');

  return (
    <div className="space-y-2 mt-3">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Priložene datoteke ({attachments.length}):
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-3 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
          >
            {isImage(attachment.file_type) ? (
              <a
                href={attachment.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 flex-1 min-w-0"
              >
                <img
                  src={attachment.file_url}
                  alt={attachment.file_name}
                  className="w-10 h-10 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate hover:text-blue-600">
                    {attachment.file_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(attachment.file_size)}
                  </p>
                </div>
              </a>
            ) : (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-2xl">{getFileIcon(attachment.file_type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(attachment.file_size)}
                  </p>
                </div>
              </div>
            )}

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
  );
}
