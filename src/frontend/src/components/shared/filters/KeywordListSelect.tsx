import { useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SOFTWARE_ENGINEERING_TAGS } from '../../../constants/tags';
import type { KeywordList, SearchTag } from '../../../types';

const NONE_VALUE = '__none__';
const CUSTOM_VALUE = '__custom__';

const BUILTIN_SWE_LIST: KeywordList = {
  id: 'builtin-swe',
  name: 'Software Engineering',
  tags: SOFTWARE_ENGINEERING_TAGS.map((tag) => ({ ...tag })),
  isBuiltin: true,
  position: 0,
};

export interface KeywordListSelectProps {
  value: SearchTag[] | undefined;
  onChange: (tags: SearchTag[] | undefined) => void;
  label?: string;
  size?: 'small' | 'medium';
}

function tagsEqual(a: SearchTag[], b: SearchTag[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((ta) => b.some((tb) => tb.text === ta.text && tb.mode === ta.mode));
}

export function KeywordListSelect({
  value,
  onChange,
  label = 'Keyword list',
}: KeywordListSelectProps) {
  const ordered = useMemo(() => [BUILTIN_SWE_LIST], []);
  const currentTags = useMemo(() => value ?? [], [value]);
  const hasTags = currentTags.length > 0;
  const matchingList = useMemo(
    () => (hasTags ? ordered.find((l) => tagsEqual(l.tags, currentTags)) : undefined),
    [ordered, currentTags, hasTags]
  );
  const selectedValue = !hasTags ? NONE_VALUE : (matchingList?.id ?? CUSTOM_VALUE);

  const handleChange = (nextValue: string) => {
    if (nextValue === CUSTOM_VALUE) return;
    if (nextValue === NONE_VALUE) {
      onChange(undefined);
      return;
    }
    const list = ordered.find((l) => l.id === nextValue);
    if (list) onChange(list.tags.map((tag) => ({ ...tag })));
  };

  return (
    <label className="grid gap-1.5">
      <span className="px-1 text-xs font-medium text-muted-foreground">{label}</span>
      <Select value={selectedValue} onValueChange={handleChange}>
        <SelectTrigger className="h-11 w-full min-w-44 rounded-xl bg-card">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE_VALUE}>None</SelectItem>
          {selectedValue === CUSTOM_VALUE && (
            <SelectItem value={CUSTOM_VALUE} disabled>
              Custom
            </SelectItem>
          )}
          {ordered.map((list) => (
            <SelectItem key={list.id} value={list.id}>
              {list.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
