import React from 'react';
import ReactMarkdown from 'react-markdown';

export interface MarkdownViewProps {
  content?: string | null;
  className?: string;
  fallbackText?: string;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({
  content,
  className = '',
  fallbackText = ''
}) => {
  if (!content || !content.trim()) {
    if (!fallbackText) return null;
    return <div className={`markdown-view ${className}`}>{fallbackText}</div>;
  }

  return (
    <div className={`markdown-view ${className}`}>
      <ReactMarkdown>
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownView;
