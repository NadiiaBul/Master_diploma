import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Timer } from 'lucide-react';

interface Props {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

export default function AnalysisIntervalSelector({ value, onChange, className = '' }: Props) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-slate-300 flex items-center gap-2 mb-4">
        <Timer className="w-4 h-4" />
        Частота аналізу (секунди)
      </Label>
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
          <SelectValue placeholder="Оберіть інтервал" />
        </SelectTrigger>

        <SelectContent className="bg-slate-700 border-slate-600 text-white">
          <SelectItem value="1000">1 секунда</SelectItem>
          <SelectItem value="3000">3 секунди</SelectItem>
          <SelectItem value="5000">5 секунд</SelectItem>
        </SelectContent>
      </Select>

      <p className="text-slate-400 text-sm">
        Аналіз аудіо буде виконуватися кожні {value / 1000} сек.
      </p>
    </div>
  );
}