import { useState, useRef, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  theme?: string;
}

export function TagInput({ tags, onChange, placeholder = 'Add tag...', className = '', theme = 'dark' }: TagInputProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      // Don't add duplicate tags
      if (!tags.includes(input.trim())) {
        onChange([...tags, input.trim()]);
      }
      setInput('');
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      // Remove last tag on backspace if input is empty
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (indexToRemove: number) => {
    onChange(tags.filter((_, index) => index !== indexToRemove));
  };

  const bgColor = theme === 'dark' ? 'bg-navy-800/50' : 'bg-white';
  const borderColor = theme === 'dark' ? 'border-navy-700' : 'border-slate-200';
  const textColor = theme === 'dark' ? 'text-navy-100' : 'text-slate-900';
  const placeholderColor = theme === 'dark' ? 'placeholder-navy-500' : 'placeholder-slate-400';
  const tagBg = theme === 'dark' ? 'bg-primary-500/20 text-primary-300 border-primary-500/20' : 'bg-primary-50 text-primary-700 border-primary-100';

  return (
    <div 
      className={`flex flex-wrap items-center gap-2 p-2 rounded-xl border ${bgColor} ${borderColor} ${className} cursor-text focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all duration-200`}
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag, index) => (
        <div 
          key={index} 
          className={`flex items-center gap-1 pl-3 pr-1 py-1 rounded-lg border text-sm font-medium ${tagBg} animate-scale-in`}
        >
          <span>{tag}</span>
          <button
            onClick={(e) => { e.stopPropagation(); removeTag(index); }}
            className={`p-0.5 hover:bg-black/10 rounded-md transition-colors`}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
        className={`bg-transparent outline-none flex-1 min-w-[120px] py-1 text-sm ${textColor} ${placeholderColor}`}
      />
    </div>
  );
}
