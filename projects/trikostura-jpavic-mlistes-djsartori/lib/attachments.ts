import { createClient } from '@/lib/supabase/client';

// Allowed file types
export const ALLOWED_FILE_TYPES = {
  // Documents
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'text/plain': '.txt',

  // Images
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',

  // Videos
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/ogg': '.ogv',

  // Audio
  'audio/mpeg': '.mp3',
  'audio/ogg': '.ogg',
  'audio/wav': '.wav',
  'audio/webm': '.weba',

  // Archives
  'application/zip': '.zip',
  'application/x-rar-compressed': '.rar',
  'application/x-7z-compressed': '.7z',
};

// Maximum file size: 10MB
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export interface UploadedAttachment {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadAttachment(
  file: File,
  userId: string
): Promise<{ url: string; error?: string }> {
  // Validate file type
  if (!ALLOWED_FILE_TYPES[file.type as keyof typeof ALLOWED_FILE_TYPES]) {
    return { url: '', error: 'Tip datoteke nije podržan' };
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return { url: '', error: `Datoteka je prevelika. Maksimalno ${MAX_FILE_SIZE / (1024 * 1024)}MB` };
  }

  const supabase = createClient();

  // Create unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `attachments/${fileName}`;

  try {
    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      return { url: '', error: 'Greška pri učitavanju datoteke' };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('attachments').getPublicUrl(filePath);

    return { url: publicUrl };
  } catch (error: any) {
    return { url: '', error: error.message || 'Greška pri učitavanju datoteke' };
  }
}

/**
 * Save attachment metadata to database
 */
export async function saveAttachmentMetadata(
  fileUrl: string,
  fileName: string,
  fileSize: number,
  fileType: string,
  userId: string,
  targetId: string,
  targetType: 'topic' | 'reply'
): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = createClient();

  const attachmentData: any = {
    file_name: fileName,
    file_url: fileUrl,
    file_size: fileSize,
    file_type: fileType,
    uploaded_by: userId,
  };

  if (targetType === 'topic') {
    attachmentData.topic_id = targetId;
  } else {
    attachmentData.reply_id = targetId;
  }

  const { data, error } = await (supabase as any)
    .from('attachments')
    .insert(attachmentData)
    .select()
    .single();

  if (error) {
    return { success: false, error: 'Greška pri spremanju datoteke' };
  }

  return { success: true, id: data.id };
}

/**
 * Delete attachment from storage and database
 */
export async function deleteAttachment(
  attachmentId: string,
  fileUrl: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  // Extract file path from URL
  const urlParts = fileUrl.split('/attachments/');
  if (urlParts.length !== 2) {
    return { success: false, error: 'Invalid file URL' };
  }

  const filePath = `attachments/${urlParts[1]}`;

  try {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('attachments')
      .remove([filePath]);

    // Continue even if storage delete fails - will be cleaned up later

    // Delete from database
    const { error: dbError } = await (supabase as any)
      .from('attachments')
      .delete()
      .eq('id', attachmentId);

    if (dbError) {
      return { success: false, error: 'Greška pri brisanju datoteke' };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Get file icon based on file type
 */
export function getFileIcon(fileType: string): string {
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType.startsWith('video/')) return '🎥';
  if (fileType.startsWith('audio/')) return '🎵';
  if (fileType === 'application/pdf') return '📄';
  if (fileType.includes('word') || fileType.includes('document')) return '📝';
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📽️';
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) return '📦';
  if (fileType === 'text/plain') return '📃';
  return '📎';
}

/**
 * Check if file is an image
 */
export function isImage(fileType: string): boolean {
  return fileType.startsWith('image/');
}

/**
 * Check if file is a video
 */
export function isVideo(fileType: string): boolean {
  return fileType.startsWith('video/');
}

/**
 * Check if file is audio
 */
export function isAudio(fileType: string): boolean {
  return fileType.startsWith('audio/');
}

/**
 * Check if file is PDF
 */
export function isPDF(fileType: string): boolean {
  return fileType === 'application/pdf';
}
