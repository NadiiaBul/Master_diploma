import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Brain } from 'lucide-react';

interface Model {
  id: number;
  name: string;
  description: string;
}

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function ModelSelector({ value, onChange, className = '' }: ModelSelectorProps) {
  const [models, setModels] = useState<Model[]>([]);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/models/active")
      .then(res => res.json())
      .then(data => {
        setModels(data);

        // Автовибір першої моделі якщо ще нічого не вибрано
        if (data.length > 0 && !value) {
          onChange(String(data[0].id));
        }
      })
      .catch(err => console.error("Failed to load models:", err));
  }, []);

  const selectedModel = models.find(m => String(m.id) === value);

  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-slate-300 flex items-center gap-2 mb-4">
        <Brain className="w-4 h-4" />
        Модель для розпізнавання
      </Label>

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
          <SelectValue placeholder="Оберіть модель" />
        </SelectTrigger>

        <SelectContent className="bg-slate-700 border-slate-600">
          {models.map((model) => (
            <SelectItem key={model.id} value={String(model.id)}>
              {model.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <p className="text-slate-400 text-sm">
        {selectedModel ? selectedModel.description : "Оберіть модель для аналізу аудіо"}
      </p>
    </div>
  );
}