'use client';

<<<<<<< HEAD
import { memo, lazy, Suspense, useMemo } from 'react';
=======
import { memo, lazy, Suspense } from 'react';
>>>>>>> 187ad88d5e209059cc273b46e6724c42f6acae42
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

<<<<<<< HEAD
// Highlight @username mentions
function preprocessMentions(content: string): string {
  // Match @username (letters, numbers, underscore, hyphen)
  const mentionRegex = /(@[a-zA-Z0-9_-]+)/g;
  return content.replace(
    mentionRegex,
    '<span class="mention bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1 rounded font-medium">$1</span>'
  );
}

=======
>>>>>>> 187ad88d5e209059cc273b46e6724c42f6acae42
// Lazy-load syntax highlighter (heavy dependency, only needed for code blocks)
const SyntaxHighlighter = lazy(() =>
  import('react-syntax-highlighter').then((mod) => ({
    default: mod.Prism,
  }))
);

export const MarkdownRenderer = memo(function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
<<<<<<< HEAD
  // Preprocess content to highlight mentions
  const processedContent = useMemo(() => preprocessMentions(content), [content]);

  return (
    <div className={`prose dark:prose-invert max-w-none ${className}`}>
=======
  return (
    <div className={`prose dark:prose-invert max-w-none break-words ${className}`}>
>>>>>>> 187ad88d5e209059cc273b46e6724c42f6acae42
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
<<<<<<< HEAD
=======
          // Safely highlight mentions in text nodes
          p({ children, ...props }: any) {
            const processedChildren = processTextWithMentions(children);
            return <p {...props}>{processedChildren}</p>;
          },
          // Wrap tables in overflow container for mobile
          table({ children, ...props }: any) {
            return (
              <div className="overflow-x-auto">
                <table {...props}>{children}</table>
              </div>
            );
          },
          // Handle pre elements (non-highlighted code blocks)
          pre({ children, ...props }: any) {
            return (
              <pre className="overflow-x-auto" {...props}>
                {children}
              </pre>
            );
          },
          // Syntax highlighting for code blocks
>>>>>>> 187ad88d5e209059cc273b46e6724c42f6acae42
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <Suspense
                fallback={
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto">
                    <code>{String(children)}</code>
                  </pre>
                }
              >
<<<<<<< HEAD
                <SyntaxHighlighter
                  language={match[1]}
                  PreTag="div"
                  customStyle={{
                    background: '#282c34',
                    padding: '1rem',
                    borderRadius: '0.375rem',
                  }}
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
=======
                <div className="overflow-x-auto">
                  <SyntaxHighlighter
                    language={match[1]}
                    PreTag="div"
                    customStyle={{
                      background: '#282c34',
                      padding: '1rem',
                      borderRadius: '0.375rem',
                    }}
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                </div>
>>>>>>> 187ad88d5e209059cc273b46e6724c42f6acae42
              </Suspense>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
<<<<<<< HEAD
        {processedContent}
=======
        {content}
>>>>>>> 187ad88d5e209059cc273b46e6724c42f6acae42
      </ReactMarkdown>
    </div>
  );
});
<<<<<<< HEAD
=======

// Safely process text content to highlight @mentions
function processTextWithMentions(children: any): any {
  if (typeof children === 'string') {
    const parts = children.split(/(@[a-zA-Z0-9_-]+)/g);
    return parts.map((part, i) => {
      if (part.match(/^@[a-zA-Z0-9_-]+$/)) {
        return (
          <span
            key={i}
            className="mention bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1 rounded font-medium"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  }

  if (Array.isArray(children)) {
    return children.map((child, i) => {
      if (typeof child === 'string') {
        return <span key={i}>{processTextWithMentions(child)}</span>;
      }
      return child;
    });
  }

  return children;
}
>>>>>>> 187ad88d5e209059cc273b46e6724c42f6acae42
