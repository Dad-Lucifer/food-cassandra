import type React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';

interface Props {
  value: string;
  onChange: (val: string) => void;
  onSelect?: (val: string) => void;
  suggestions: string[];
  placeholder?: string;
  inputStyle?: React.CSSProperties;
  onEnter?: () => void;
  autoFocus?: boolean;
  maxSuggestions?: number;
}

const DROPDOWN_STYLE: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  background: '#fff',
  border: '1px solid #e0e0e0',
  borderTop: 'none',
  borderRadius: '0 0 10px 10px',
  boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
  zIndex: 999,
  overflow: 'hidden',
  maxHeight: 320,
  overflowY: 'auto',
};

/** Bold the part of `text` that matches `query` (case-insensitive). */
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <strong style={{ color: '#FF5733' }}>{text.slice(idx, idx + query.length)}</strong>
      {text.slice(idx + query.length)}
    </span>
  );
}

export default function AutocompleteInput({
  value,
  onChange,
  onSelect,
  suggestions,
  placeholder = '',
  inputStyle = {},
  onEnter,
  autoFocus = false,
  maxSuggestions = 8,
}: Props) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter suggestions by current value
  const filtered = value.trim()
    ? suggestions
        .filter((s) => s.toLowerCase().includes(value.toLowerCase()))
        .filter((s) => s.toLowerCase() !== value.toLowerCase()) // hide exact match
        .slice(0, maxSuggestions)
    : [];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIdx(-1);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectSuggestion = useCallback(
    (s: string) => {
      onChange(s);
      onSelect?.(s);
      setOpen(false);
      setActiveIdx(-1);
    },
    [onChange, onSelect]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || filtered.length === 0) {
      if (e.key === 'Enter') onEnter?.();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx >= 0) {
        selectSuggestion(filtered[activeIdx]);
      } else {
        setOpen(false);
        onEnter?.();
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIdx(-1);
    }
  };

  const baseInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    fontSize: '0.95rem',
    border: '1px solid #ddd',
    borderRadius: open && filtered.length > 0 ? '8px 8px 0 0' : '8px',
    borderBottom: open && filtered.length > 0 ? '1px solid transparent' : '1px solid #ddd',
    outline: 'none',
    color: '#222',
    background: '#fff',
    boxSizing: 'border-box',
    ...inputStyle,
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', flex: 1, minWidth: 0 }}>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActiveIdx(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={baseInputStyle}
        autoFocus={autoFocus}
        autoComplete="off"
      />

      {open && filtered.length > 0 && (
        <div style={DROPDOWN_STYLE}>
          {filtered.map((s, idx) => (
            <div
              key={s}
              onMouseDown={(e) => {
                e.preventDefault(); // don't blur input first
                selectSuggestion(s);
              }}
              onMouseEnter={() => setActiveIdx(idx)}
              style={{
                padding: '10px 14px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                color: '#222',
                background: activeIdx === idx ? '#fff8f7' : '#fff',
                borderLeft: activeIdx === idx ? '3px solid #FF5733' : '3px solid transparent',
                transition: 'background 0.1s',
              }}
            >
              <HighlightMatch text={s} query={value} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
