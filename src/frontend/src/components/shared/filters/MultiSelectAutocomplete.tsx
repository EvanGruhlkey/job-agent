import { useId, useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { getArrayDiff } from '../../../features/filters/utils/filterUtils.ts';

export interface MultiSelectAutocompleteProps {
  label: string;
  options: string[];
  value: string[];
  onAdd: (item: string) => void;
  onRemove: (item: string) => void;
  placeholder?: string;
  size?: 'small' | 'medium';
  minWidth?: number;
}

export function MultiSelectAutocomplete({
  label,
  options,
  value,
  onAdd,
  onRemove,
  placeholder = label,
}: MultiSelectAutocompleteProps) {
  const id = useId();
  const listId = `${id}-options`;
  const [inputValue, setInputValue] = useState('');

  const commitValue = () => {
    const exact = options.find((option) => option.toLowerCase() === inputValue.trim().toLowerCase());
    const next = exact ?? inputValue.trim();
    if (!next || value.includes(next)) return;
    const { added, removed } = getArrayDiff(value, [...value, next]);
    removed.forEach((item) => onRemove(item));
    added.forEach((item) => onAdd(item));
    setInputValue('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commitValue();
    }
  };

  return (
    <label className="grid gap-1.5">
      <span className="px-1 text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex min-h-11 min-w-44 flex-wrap items-center gap-1.5 rounded-xl border bg-card px-2 py-1.5 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
        {value.map((item) => (
          <Badge key={item} variant="secondary" className="gap-1">
            {item}
            <button type="button" onClick={() => onRemove(item)} aria-label={`Remove ${item}`}>
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        <Input
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commitValue}
          list={listId}
          placeholder={value.length === 0 ? placeholder : ''}
          className="h-8 min-w-28 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
        />
        <datalist id={listId}>
          {options.slice(0, 500).map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </div>
    </label>
  );
}
