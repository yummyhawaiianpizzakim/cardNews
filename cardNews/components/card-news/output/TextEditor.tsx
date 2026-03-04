'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface TextEditorProps {
  /** Current text value */
  value: string;
  /** Called when text changes */
  onChange: (value: string) => void;
  /** Editor type */
  type: 'headline' | 'subtext';
  /** Number of rows for textarea (subtext only) */
  rows?: number;
  /** Base class names for display mode */
  className?: string;
  /** Is editing disabled? */
  disabled?: boolean;
}

/**
 * Inline text editor that switches between display and edit mode
 * DSGN-05: 렌더링된 카드 위에서 헤드라인·서브텍스트를 직접 클릭해 수정할 수 있다
 * DSGN-06: 수정 즉시 미리보기에 실시간 반영한다
 */
export function TextEditor({
  value,
  onChange,
  type,
  rows = 3,
  className = '',
  disabled = false,
}: TextEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const editRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Update edit value when prop changes (but not during editing)
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  const handleClick = () => {
    if (disabled) return;
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onChange(editValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditValue(value); // Revert
      setIsEditing(false);
    } else if (e.key === 'Enter' && !e.shiftKey && type === 'headline') {
      e.preventDefault();
      setIsEditing(false);
      onChange(editValue);
    }
  };

  // Auto-focus input when entering edit mode
  useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.focus();
    }
  }, [isEditing]);

  if (isEditing && !disabled) {
    if (type === 'headline') {
      return (
        <Input
          ref={editRef as React.RefObject<HTMLInputElement>}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="bg-transparent border-2 border-[var(--color-accent)]"
          autoFocus
        />
      );
    } else {
      return (
        <Textarea
          ref={editRef as React.RefObject<HTMLTextAreaElement>}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="bg-transparent border-2 border-[var(--color-accent)] resize-none"
          rows={rows}
          autoFocus
        />
      );
    }
  }

  // Display mode
  if (type === 'headline') {
    return (
      <h1
        onClick={handleClick}
        className={`cursor-pointer ${disabled ? '' : 'hover:opacity-80'} ${className}`}
      >
        {value}
      </h1>
    );
  } else {
    return (
      <p
        onClick={handleClick}
        className={`cursor-pointer leading-relaxed ${disabled ? '' : 'hover:opacity-80'} ${className}`}
      >
        {value}
      </p>
    );
  }
}
