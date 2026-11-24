import React, { useMemo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';

export interface MarkdownViewProps {
  content?: string | null;
  className?: string;
  fallbackText?: string;
}

function transformUnderline(text: string): string {
  return text.replace(/<u>([\s\S]*?)<\/u>/gi, '[$1](#__u__)');
}

const customMarkdownComponents: Components = {
  a: ({ href, children, ...props }) => {
    if (href === '#__u__') {
      return <u style={{ textDecoration: 'underline' }}>{children}</u>;
    }
    return <a href={href} {...props}>{children}</a>;
  }
};

interface MarkdownSegment {
  type: 'normal' | 'aligned';
  align?: 'center' | 'right' | 'left';
  content: string;
}

function parseMarkdownSegments(rawText: string): MarkdownSegment[] {
  const alignRegex = /(<div\b[^>]*align=["']?(center|right|left)["']?[^>]*>)([\s\S]*?)(<\/div>)/gi;
  const segments: MarkdownSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = alignRegex.exec(rawText)) !== null) {
    const matchStart = match.index;
    const matchEnd = alignRegex.lastIndex;

    if (matchStart > lastIndex) {
      const beforeText = rawText.slice(lastIndex, matchStart);
      if (beforeText.trim()) {
        segments.push({
          type: 'normal',
          content: beforeText
        });
      }
    }

    const alignment = (match[2]?.toLowerCase() || 'center') as 'center' | 'right' | 'left';
    const innerContent = match[3] || '';

    segments.push({
      type: 'aligned',
      align: alignment,
      content: innerContent
    });

    lastIndex = matchEnd;
  }

  if (lastIndex < rawText.length) {
    const remaining = rawText.slice(lastIndex);
    if (remaining.trim()) {
      segments.push({
        type: 'normal',
        content: remaining
      });
    }
  }

  if (segments.length === 0) {
    segments.push({ type: 'normal', content: rawText });
  }

  return segments;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({
  content,
  className = '',
  fallbackText = ''
}) => {
  const segments = useMemo(() => {
    if (!content || !content.trim()) return [];
    return parseMarkdownSegments(content);
  }, [content]);

  if (!content || !content.trim() || segments.length === 0) {
    if (!fallbackText) return null;
    return <div className={`markdown-view ${className}`}>{fallbackText}</div>;
  }

  return (
    <div className={`markdown-view ${className}`}>
      {segments.map((seg, idx) => {
        const transformed = transformUnderline(seg.content.trim());
        const mdElement = (
          <ReactMarkdown key={idx} components={customMarkdownComponents}>
            {transformed}
          </ReactMarkdown>
        );

        if (seg.type === 'aligned') {
          return (
            <div
              key={idx}
              style={{ textAlign: seg.align }}
              className={`markdown-align-${seg.align || 'center'}`}
            >
              {mdElement}
            </div>
          );
        }

        return mdElement;
      })}
    </div>
  );
};

export default MarkdownView;
