'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { EditTopicForm } from './edit-topic-form';
import { MarkdownRenderer } from './markdown-renderer';
import { useRouter } from 'next/navigation';

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
  topicId,
  title,
  content,
  isAuthor,
  isAdmin,
  isLocked,
  editedAt,
  createdAt
}: EditableTopicProps) {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  const canEdit = (isAuthor || isAdmin) && !isLocked;
  const wasEdited = editedAt && editedAt !== createdAt;

  const handleSuccess = () => {
    setIsEditing(false);
    router.refresh();
  };

  if (isEditing) {
    return (
      <div className="mt-4">
        <h2 className="text-xl font-bold mb-4">Uredi temu</h2>
        <EditTopicForm
          topicId={topicId}
          initialTitle={title}
          initialContent={content}
          onCancel={() => setIsEditing(false)}
          onSuccess={handleSuccess}
        />
      </div>
    );
  }

  return (
    <div>
      {canEdit && (
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Uredi
          </Button>
        </div>
      )}

      <MarkdownRenderer content={content} />

      {wasEdited && (
        <p className="text-xs text-gray-500 mt-4 italic">
          Uređeno: {new Date(editedAt).toLocaleString('hr-HR')}
        </p>
      )}
    </div>
  );
}
