// Custom event system for bookmark notifications

export const BOOKMARK_EVENT = 'bookmark-toggled';

export interface BookmarkEventDetail {
  topicId: string;
  bookmarked: boolean;
}

export function emitBookmarkEvent(detail: BookmarkEventDetail) {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent(BOOKMARK_EVENT, { detail });
    window.dispatchEvent(event);
  }
}

export function onBookmarkEvent(
  callback: (detail: BookmarkEventDetail) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<BookmarkEventDetail>;
    callback(customEvent.detail);
  };

  window.addEventListener(BOOKMARK_EVENT, handler);

  return () => {
    window.removeEventListener(BOOKMARK_EVENT, handler);
  };
}
