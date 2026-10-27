'use client';

import React from 'react';

/**
 * Strips formatting (markdown & basic HTML tags) for clean text excerpts on cards.
 */
export function stripBlogFormatting(text: string): string {
  if (!text) return '';
  return text
    // Replace headings (# H1, ## H2, etc.)
    .replace(/^#{1,6}\s+/gm, '')
    // Replace bold/italic markers
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    // Replace strikethrough
    .replace(/~~(.*?)~~/g, '$1')
    // Replace blockquote markers
    .replace(/^>\s+/gm, '')
    // Replace list bullets / numbers
    .replace(/^(\*|-|\+)\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    // Remove horizontal rules
    .replace(/^-{3,}$/gm, '')
    // Strip common HTML tags
    .replace(/<\/?[^>]+(>|$)/g, '')
    // Normalize extra whitespace
    .replace(/\n+/g, ' ')
    .trim();
}

/**
 * Parses inline formatting: bold, italic, underline, strikethrough, code, font spans
 */
function renderInlineText(text: string): React.ReactNode[] {
  // Tokenize string for inline tags:
  // **bold**, *italic*, <u>underline</u>, ~~strikethrough~~, <span class="...">...</span>, `code`
  const regex = /(\*\*.*?\*\*|\*.*?\*|<u>.*?<\/u>|~~.*?~~|`.*?`|<span[^>]*>.*?<\/span>)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Bold: **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={index} className="font-bold text-stone-900">
          {renderInlineText(part.slice(2, -2))}
        </strong>
      );
    }

    // Italic: *text*
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={index} className="italic text-stone-800">
          {renderInlineText(part.slice(1, -1))}
        </em>
      );
    }

    // Underline: <u>text</u>
    if (part.startsWith('<u>') && part.endsWith('</u>')) {
      return (
        <span key={index} className="underline decoration-stone-400 underline-offset-3">
          {renderInlineText(part.slice(3, -4))}
        </span>
      );
    }

    // Strikethrough: ~~text~~
    if (part.startsWith('~~') && part.endsWith('~~') && part.length >= 4) {
      return (
        <del key={index} className="line-through text-stone-400">
          {renderInlineText(part.slice(2, -2))}
        </del>
      );
    }

    // Inline Code: `code`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code key={index} className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-800 text-xs font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }

    // Font size / color spans: <span class="...">text</span> or <span style="...">text</span>
    if (part.startsWith('<span') && part.endsWith('</span>')) {
      const match = part.match(/^<span\s+class=["']([^"']+)["']>([\s\S]*?)<\/span>$/);
      if (match) {
        return (
          <span key={index} className={match[1]}>
            {renderInlineText(match[2])}
          </span>
        );
      }
      const rawText = part.replace(/<\/?[^>]+(>|$)/g, '');
      return <span key={index}>{rawText}</span>;
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

interface BlogRendererProps {
  content: string;
  className?: string;
}

/**
 * Beautiful, secure rich renderer for Arboveya blog articles
 */
export default function BlogRenderer({ content, className = '' }: BlogRendererProps) {
  if (!content) {
    return <p className="text-stone-400 italic">No content available.</p>;
  }

  // Split lines into blocks
  const rawLines = content.split(/\r?\n/);
  const elements: React.ReactNode[] = [];

  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;

  const flushList = (key: string) => {
    if (!currentList) return;
    if (currentList.type === 'ul') {
      elements.push(
        <ul key={key} className="space-y-1.5 my-3 pl-2 list-none">
          {currentList.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-stone-700 text-sm sm:text-base leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2E4D38] mt-2 flex-shrink-0" />
              <span>{renderInlineText(item)}</span>
            </li>
          ))}
        </ul>
      );
    } else {
      elements.push(
        <ol key={key} className="space-y-1.5 my-3 pl-2 list-none">
          {currentList.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-stone-700 text-sm sm:text-base leading-relaxed">
              <span className="text-xs font-bold text-[#2E4D38] bg-emerald-50 border border-emerald-200/60 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span>{renderInlineText(item)}</span>
            </li>
          ))}
        </ol>
      );
    }
    currentList = null;
  };

  rawLines.forEach((line, index) => {
    const trimmed = line.trim();

    // Check for lists
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const itemText = trimmed.replace(/^[-*]\s+/, '');
      if (currentList && currentList.type === 'ul') {
        currentList.items.push(itemText);
      } else {
        flushList(`list-${index}`);
        currentList = { type: 'ul', items: [itemText] };
      }
      return;
    }

    const numMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (numMatch) {
      const itemText = numMatch[1];
      if (currentList && currentList.type === 'ol') {
        currentList.items.push(itemText);
      } else {
        flushList(`list-${index}`);
        currentList = { type: 'ol', items: [itemText] };
      }
      return;
    }

    // Not a list item, flush any open list
    flushList(`flush-${index}`);

    // Horizontal Rule
    if (trimmed === '---' || trimmed === '***') {
      elements.push(<hr key={`hr-${index}`} className="my-6 border-stone-200" />);
      return;
    }

    // Heading 1 (# Heading)
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h1
          key={`h1-${index}`}
          className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-6 mb-3 leading-snug"
        >
          {renderInlineText(trimmed.replace(/^#\s+/, ''))}
        </h1>
      );
      return;
    }

    // Heading 2 (## Heading)
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h2
          key={`h2-${index}`}
          className="text-xl sm:text-2xl font-serif font-bold text-[#2E4D38] mt-5 mb-2.5 leading-snug border-b border-stone-100 pb-1.5"
        >
          {renderInlineText(trimmed.replace(/^##\s+/, ''))}
        </h2>
      );
      return;
    }

    // Heading 3 (### Heading)
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3
          key={`h3-${index}`}
          className="text-base sm:text-lg font-serif font-bold text-stone-800 mt-4 mb-2 leading-snug"
        >
          {renderInlineText(trimmed.replace(/^###\s+/, ''))}
        </h3>
      );
      return;
    }

    // Blockquote (> Quote)
    if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote
          key={`quote-${index}`}
          className="border-l-4 border-[#2E4D38] bg-stone-50/80 px-4 py-2.5 my-3 rounded-r-xl italic text-stone-700 text-sm sm:text-base font-serif"
        >
          {renderInlineText(trimmed.replace(/^>\s+/, ''))}
        </blockquote>
      );
      return;
    }

    // Empty line -> spacing
    if (!trimmed) {
      elements.push(<div key={`empty-${index}`} className="h-3" />);
      return;
    }

    // Standard paragraph
    elements.push(
      <p
        key={`p-${index}`}
        className="text-stone-700 text-sm sm:text-base leading-relaxed font-sans"
      >
        {renderInlineText(line)}
      </p>
    );
  });

  // Flush any final list
  flushList('final-list');

  return <div className={`space-y-1.5 ${className}`}>{elements}</div>;
}
