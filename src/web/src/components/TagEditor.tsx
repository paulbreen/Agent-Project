import { useState, useEffect, useRef } from 'react';
import type { Tag } from '../types/article';
import { tagsApi } from '../services/api';

interface TagEditorProps {
  articleId: string;
  tags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
}

export function TagEditor({ articleId, tags, onTagsChange }: TagEditorProps) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      tagsApi.getAll().then(setAllTags);
      inputRef.current?.focus();
    }
  }, [editing]);

  useEffect(() => {
    if (!input.trim()) {
      setSuggestions([]);
      setHighlightIndex(-1);
      return;
    }
    const lower = input.toLowerCase();
    const currentNames = new Set(tags.map((t) => t.name));
    const filtered = allTags
      .filter((t) => t.name.includes(lower) && !currentNames.has(t.name))
      .slice(0, 5);
    setSuggestions(filtered);
    setHighlightIndex(-1);
  }, [input, allTags, tags]);

  const addTag = async (name: string) => {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed || trimmed.length > 50) return;
    if (tags.length >= 10) return;
    if (tags.some((t) => t.name === trimmed)) return;

    const newTagNames = [...tags.map((t) => t.name), trimmed];
    const { articlesApi } = await import('../services/api');
    const updatedTags = await articlesApi.setTags(articleId, newTagNames);
    onTagsChange(updatedTags);
    setInput('');
    setSuggestions([]);
  };

  const removeTag = async (name: string) => {
    const newTagNames = tags.filter((t) => t.name !== name).map((t) => t.name);
    const { articlesApi } = await import('../services/api');
    const updatedTags = await articlesApi.setTags(articleId, newTagNames);
    onTagsChange(updatedTags);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIndex >= 0 && highlightIndex < suggestions.length) {
        addTag(suggestions[highlightIndex].name);
      } else if (input.trim()) {
        addTag(input);
      }
    } else if (e.key === 'Escape') {
      setEditing(false);
      setInput('');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1].name);
    }
  };

  if (!editing) {
    return (
      <div
        style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', alignItems: 'center' }}
        onClick={(e) => e.stopPropagation()}
      >
        {tags.map((tag) => (
          <span
            key={tag.id}
            style={{
              background: '#e8f0fe',
              color: '#1a73e8',
              padding: '0.1rem 0.4rem',
              borderRadius: 3,
              fontSize: '0.75rem',
            }}
          >
            {tag.name}
          </span>
        ))}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setEditing(true);
          }}
          style={{
            background: 'none',
            border: '1px dashed #ccc',
            borderRadius: 3,
            padding: '0.1rem 0.35rem',
            fontSize: '0.75rem',
            color: '#999',
            cursor: 'pointer',
          }}
        >
          + tag
        </button>
      </div>
    );
  }

  return (
    <div
      style={{ position: 'relative' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.25rem',
          alignItems: 'center',
          border: '1px solid #4a9eff',
          borderRadius: 4,
          padding: '0.25rem',
          background: '#fff',
        }}
      >
        {tags.map((tag) => (
          <span
            key={tag.id}
            style={{
              background: '#e8f0fe',
              color: '#1a73e8',
              padding: '0.1rem 0.4rem',
              borderRadius: 3,
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem',
            }}
          >
            {tag.name}
            <button
              onClick={() => removeTag(tag.name)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                fontSize: '0.8rem',
                color: '#1a73e8',
                lineHeight: 1,
              }}
            >
              &times;
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            // Delay to allow click on suggestion
            setTimeout(() => setEditing(false), 150);
          }}
          placeholder={tags.length >= 10 ? 'Max tags reached' : 'Add tag...'}
          disabled={tags.length >= 10}
          maxLength={50}
          style={{
            border: 'none',
            outline: 'none',
            fontSize: '0.8rem',
            flex: 1,
            minWidth: 60,
            padding: '0.1rem',
          }}
        />
      </div>

      {suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '100%',
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: 4,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            zIndex: 20,
          }}
        >
          {suggestions.map((tag, i) => (
            <div
              key={tag.id}
              onClick={() => addTag(tag.name)}
              style={{
                padding: '0.35rem 0.5rem',
                cursor: 'pointer',
                fontSize: '0.85rem',
                background: i === highlightIndex ? '#f0f0f0' : 'transparent',
              }}
            >
              {tag.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
