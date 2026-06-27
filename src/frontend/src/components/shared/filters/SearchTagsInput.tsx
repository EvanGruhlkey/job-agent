import { useState, type KeyboardEvent } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { parseSearchTagInput } from '../../../features/filters/utils/filterUtils.ts';
import type { SearchTag } from '../../../types';

export interface SearchTagsInputProps {
  value: SearchTag[];
  onAdd: (tag: SearchTag) => void;
  onRemove: (text: string) => void;
  onToggleMode: (text: string) => void;
  placeholder?: string;
  showSearchIcon?: boolean;
}

export function SearchTagsInput({
  value,
  onAdd,
  onRemove,
  onToggleMode,
  placeholder,
  showSearchIcon = false,
}: SearchTagsInputProps) {
  const [inputValue, setInputValue] = useState('');

  const submitValue = () => {
    const parsed = parseSearchTagInput(inputValue);
    if (!parsed) return;
    onAdd(parsed);
    setInputValue('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submitValue();
    }
  };

  return (
    <div className="rounded-xl border bg-card px-3 py-2 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
      <div className="flex min-h-8 flex-wrap items-center gap-2">
        {showSearchIcon && <Search className="size-4 shrink-0 text-muted-foreground" />}
        {value.map((tag) => (
          <Badge
            key={tag.text}
            variant={tag.mode === 'include' ? 'secondary' : 'destructive'}
            className="h-7 gap-1"
          >
            <button
              type="button"
              className="inline-flex items-center gap-1"
              onClick={() => onToggleMode(tag.text)}
              title="Toggle include/exclude"
            >
              {tag.mode === 'include' && <Plus className="size-3" />}
              {tag.text}
            </button>
            <button type="button" onClick={() => onRemove(tag.text)} aria-label={`Remove ${tag.text}`}>
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        <Input
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            placeholder ??
            (value.length > 0
              ? 'Add another tag...'
              : 'Type to add search tags: -senior or senior...')
          }
          className="h-8 min-w-52 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
        />
      </div>
    </div>
  );
}
