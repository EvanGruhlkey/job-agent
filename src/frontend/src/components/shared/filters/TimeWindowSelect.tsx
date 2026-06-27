import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TIME_WINDOWS } from '../../../constants/filters.ts';
import type { TimeWindow } from '../../../types';

export interface TimeWindowSelectProps {
  value: TimeWindow;
  onChange: (timeWindow: TimeWindow) => void;
  label?: string;
  size?: 'small' | 'medium';
}

export function TimeWindowSelect({
  value,
  onChange,
  label = 'Time Window',
}: TimeWindowSelectProps) {
  return (
    <label className="grid gap-1.5">
      <span className="px-1 text-xs font-medium text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={(next) => onChange(next as TimeWindow)}>
        <SelectTrigger className="h-11 w-full min-w-36 rounded-xl bg-card">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TIME_WINDOWS.map((tw) => (
            <SelectItem key={tw.value} value={tw.value}>
              {tw.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
