'use client';

import { MarkdownRenderer } from './markdown-renderer';

interface EditableTopicProps {
  topicId: string;
  title: string;
  content: string;
  isAuthor: boolean;
  isAdmin: boolean;
  isLocked: boolean;
  editedAt: string | null;
  createdAt: string;
}

export function EditableTopic({
  editedAt,
  content,
  createdAt
}: EditableTopicProps) {
  const wasEdited = editedAt && editedAt !== createdAt;

  return (
    <div>
      <MarkdownRenderer content={content} />

      {wasEdited && (
        <p className="text-xs text-gray-500 mt-4 italic">
          Uređeno: {new Date(editedAt).toLocaleString('hr-HR')}
        </p>
      )}
    </div>
  );
}
