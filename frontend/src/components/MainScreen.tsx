import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Upload, Radio, Search, Filter, ShieldCheck, ClipboardList, Gauge, Cpu, Mic, Plane, User, Bell } from 'lucide-react';
/*import { useAuth } from '../contexts/AuthContext';*/
import { useTheme } from '../contexts/ThemeContext';

interface Log {
  id: number;
  type: 'Дрон' | 'Літак' | 'Вертоліт';
  time: string;
  confidence: number;
  accuracy: number;
  duration: number; // milliseconds
  source: string; // "файл" | "реальний час" або інший текст
}

interface MainScreenProps {
  onNavigate: (screen: 'upload' | 'realtime') => void;
}

export default function MainScreen({ onNavigate }: MainScreenProps) {
  const { theme } = useTheme();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [logs, setLogs] = useState<Log[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'Дрон' | 'Літак' | 'Вертоліт'>('all');

  useEffect(() => {
    const interval = setInterval(() => {
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  const [allowRealtime, setAllowRealtime] = useState(true);

  useEffect(() => {
      fetch("http://127.0.0.1:5000/api/settings/realtime")
          .then(res => res.json())
          .then(data => setAllowRealtime(data.allow_realtime === true));
  }, []);

  // Завантаження логів з бекенду
  useEffect(() => {

    fetch(`http://127.0.0.1:5000/api/logs?user_id=${Number(localStorage.getItem("userId"))}`)
      .then(res => res.json())
      .then(data => {
        console.log("Сирі логи з бекенду:", data);

        const mapped = data.map((row: any) => ({
          id: row.id,
          type: row.type,
          time: row.time,
          confidence: row.confidence,
          duration: row.duration,
          source: row.source
        }));

        console.log("Перетворені логи:", mapped);

        setLogs(mapped);
      })
      .catch(err => console.error("Помилка завантаження логів:", err));
  }, []);
  
  // Mock logs (заповни з бекенду пізніше)
  /*const logs: Log[] = [
    { id: 1, type: 'Дрон', time: '21.10.2025 14:23:15', confidence: 95.3, accuracy: 94.8, duration: 2340, source: 'файл' },
    { id: 2, type: 'Літак', time: '21.10.2025 13:45:22', confidence: 88.7, accuracy: 91.2, duration: 1850, source: 'реальний час' },
    { id: 3, type: 'Вертоліт', time: '21.10.2025 12:18:09', confidence: 92.1, accuracy: 93.5, duration: 2100, source: 'файл' },
    { id: 4, type: 'Дрон', time: '21.10.2025 11:56:44', confidence: 97.8, accuracy: 96.2, duration: 3200, source: 'реальний час' },
    { id: 5, type: 'Літак', time: '21.10.2025 10:32:18', confidence: 89.4, accuracy: 90.1, duration: 1950, source: 'файл' },
    { id: 6, type: 'Дрон', time: '21.10.2025 09:15:33', confidence: 94.6, accuracy: 93.9, duration: 2680, source: 'реальний час' },
  ];*/

  /*const filteredLogs = logs.filter(log => {
    const matchesType = typeFilter === 'all' || log.type === typeFilter;
    const matchesSearch = log.time.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.source.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const stats = {
    totalDetections: logs.length,
    drones: logs.filter(l => l.type === 'Дрон').length,
    planes: logs.filter(l => l.type === 'Літак').length,
    helicopters: logs.filter(l => l.type === 'Вертоліт').length,
  };*/
    // Фільтрація логів
  const filteredLogs = logs.filter(log => {
    const matchesType = typeFilter === 'all' || log.type === typeFilter;
    const q = searchQuery.toLowerCase();

    const matchesSearch =
      log.time.toLowerCase().includes(q) ||
      log.type.toLowerCase().includes(q) ||
      log.source.toLowerCase().includes(q);

    return matchesType && matchesSearch;
  });

  // Статистика
  const stats = {
    totalDetections: logs.length,
    drones: logs.filter(l => l.type === 'Дрон').length,
    planes: logs.filter(l => l.type === 'Літак').length,
    helicopters: logs.filter(l => l.type === 'Вертоліт').length,
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'Дрон': return 'bg-red-500 hover:bg-red-600';
      case 'Літак': return 'bg-blue-500 hover:bg-blue-600';
      case 'Вертоліт': return 'bg-green-500 hover:bg-green-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-blue-50 via-white to-blue-50'} p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Основні кнопки */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <Card
            className="p-8 bg-gradient-to-br from-blue-600 to-blue-700 border-0 cursor-pointer hover:from-blue-500 hover:to-blue-600 transition-all"
            onClick={() => onNavigate('upload')}
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                <Upload className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-white text-2xl">Завантажити аудіо-файл</h2>
              <p className="text-white">Завантажте аудіо для аналізу та розпізнавання літальних апаратів</p>
            </div>
          </Card>

          <Card
              className={`p-8 bg-gradient-to-br from-purple-600 to-purple-700 border-0 transition-all 
                  ${!allowRealtime ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:from-purple-500 hover:to-purple-600"}`}
              onClick={() => allowRealtime && onNavigate('realtime')}
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                <Radio className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-white text-2xl">Робота в режимі реального часу</h2>
              <p className="text-white">Моніторинг та аналіз звуків у реальному часі</p>
            </div>
          </Card>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className={`p-4 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <p className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'} text-sm`}>Всього виявлень</p>
            <p className={`${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-2xl mt-1`}>{stats.totalDetections}</p>
          </Card>

          <Card className={`p-4 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <p className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'} text-sm`}>Дрони</p>
            <p className="text-red-400 text-2xl mt-1">{stats.drones}</p>
          </Card>

          <Card className={`p-4 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <p className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'} text-sm`}>Літаки</p>
            <p className="text-blue-400 text-2xl mt-1">{stats.planes}</p>
          </Card>

          <Card className={`p-4 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <p className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'} text-sm`}>Вертольоти</p>
            <p className="text-green-400 text-2xl mt-1">{stats.helicopters}</p>
          </Card>
        </div>

        {/* Tabs (оригінальні підписи) */}
        <Tabs defaultValue="logs" className="w-full">
          <TabsList className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-gray-200 border-gray-300'}`}>
            <TabsTrigger 
              value="logs" 
              className={`data-[state=active]:bg-slate-700 data-[state=active]:text-white ${theme === 'dark' ? 'text-slate-300' : 'text-black'}`}
            >
              Логи розпізнавання
            </TabsTrigger>
            <TabsTrigger 
              value="guide" 
              className={`data-[state=active]:bg-slate-700 data-[state=active]:text-white ${theme === 'dark' ? 'text-slate-300' : 'text-black'}`}
            >
              Посібник користувача
            </TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="mt-4">
            <Card className={`p-6 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              {/* Search and Filters */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <Input
                    placeholder="Пошук за часом або типом апарата..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`${theme === 'dark' ? 'pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400' : 'pl-10 bg-white border-slate-300 text-slate-800 placeholder:text-slate-400'}`}
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <Filter className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'} w-5 h-5`} />
                  <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
                    <SelectTrigger className={`${theme === 'dark' ? 'w-48 bg-slate-700 border-slate-600 text-white' : 'w-48 bg-white border-slate-300 text-slate-700'}`}>
                      <SelectValue placeholder="Тип апарата" />
                    </SelectTrigger>
                    <SelectContent
                      className={
                        theme === "dark"
                          ? "select-content-dark border-slate-600 text-white"
                          : "select-content-light border-slate-300 text-slate-700"
                      }
                    >
                      <SelectItem value="all">Всі типи</SelectItem>
                      <SelectItem value="Дрон">Дрон</SelectItem>
                      <SelectItem value="Літак">Літак</SelectItem>
                      <SelectItem value="Вертоліт">Вертоліт</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Logs Table */}
              <div className={`rounded-lg border ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
                <div className="max-h-[400px] overflow-y-auto">
                  <Table>
                  <TableHeader className={theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'}>
                    <TableRow className={theme === 'dark' ? 'hover:bg-slate-700 border-slate-600' : 'hover:bg-slate-100 border-slate-200'}>
                      <TableHead className={theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}>Тип апарата</TableHead>
                      <TableHead className={theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}>Час розпізнавання</TableHead>
                      <TableHead className={theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}>Впевненість (%)</TableHead>
                      <TableHead className={theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}>Тривалість обробки</TableHead>
                      <TableHead className={theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}>Джерело</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map(log => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge className={`${getTypeBadgeColor(log.type)} text-white`}>
                            {log.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.time}</TableCell>
                        <TableCell>{log.confidence.toFixed(1)}%</TableCell>
                        <TableCell>{log.duration} мс</TableCell>
                        <TableCell>{log.source}</TableCell>
                      </TableRow>
                    ))}

                    {filteredLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-slate-400">
                          Немає записів
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="guide" className="mt-4">
            <Card className={`p-6 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <h3 className={`${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-xl mb-4`}>Посібник користувача</h3>

              <div className="space-y-6">

                {/* Upload */}
                <div>
                  <h4 className={`flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-2`}>
                    <Upload className="w-5 h-5 text-blue-500" />
                    Завантаження аудіо-файлу
                  </h4>
                  <p className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                    Використовуйте режим <strong>“Завантажити аудіо-файл”</strong> для аналізу існуючих аудіозаписів.
                    Підтримувані формати:
                    <span className="text-blue-400 font-semibold"> MP3</span>, 
                    <span className="text-blue-400 font-semibold"> WAV</span>, 
                    <span className="text-blue-400 font-semibold"> OGG</span>.
                    <br />
                    Система автоматично визначає тип літального апарата та показує відсоток впевненості моделі. Можна прослухати завантажений файл та завантажити логи розпізнавання.
                  </p>
                </div>

                {/* Live Mode */}
                <div>
                  <h4 className={`flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-2`}>
                    <Mic className="w-5 h-5 text-green-500" />
                    Режим реального часу
                  </h4>
                  <p className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                    У режимі реального часу система <strong>постійно слухає звук з мікрофона</strong> і виконує 
                    розпізнавання без зупинки. Можна обрати частоту аналізу моделі: 1, 3 або 5 секунд. Усі виявлені апарати записуються до журналу логів разом із:
                  </p>
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                    <li className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>міткою часу</li>
                    <li className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>типом виявленого об’єкта</li>
                    <li className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>впевненістю моделі</li>
                    <li className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>часом обробки</li>
                  </ul>
                </div>

                {/* Aircraft Types */}
                <div>
                  <h4 className={`flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-2`}>
                    <Plane className="w-5 h-5 text-purple-500" />
                    Типи літальних апаратів
                  </h4>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                      <strong>Дрон</strong> — малий безпілотний апарат, характерний високочастотним шумом.
                    </li>
                    <li className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                      <strong>Літак</strong> — великий літальний апарат з потужним низькочастотним сигналом.
                    </li>
                    <li className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                      <strong>Вертоліт</strong> — гвинтокрил з ритмічними коливаннями звуку.
                    </li>
                  </ul>
                </div>

                {/* Metrics */}
                <div>
                  <h4 className={`flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-2`}>
                    <Gauge className="w-5 h-5 text-yellow-500" />
                    Метрики моделі
                  </h4>
                  <p className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                    <strong>Впевненість (Confidence)</strong> — рівень переконаності моделі у правильності класифікації.
                  </p>
                  <p className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                    <strong>Точність (Accuracy)</strong> — показник ефективності нейромережі на тестових даних.
                  </p>
                </div>

                {/* Logs */}
                <div>
                  <h4 className={`flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-2`}>
                    <User className="w-5 h-5 text-cyan-500" />
                    Профіль користувача
                  </h4>
                  <p className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                    Натиснувши на аватар, відкриється спливаюче меню. 
                    У розділі <strong>“Профіль користувача”</strong> ви можете переглянути:
                  </p>
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                    <li className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>тривалість поточної сесії</li>
                    <li className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>налаштувати сповіщення за певним порогом впевненості моделі</li>
                    <li className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>змінити пароль</li>
                    <li className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>видалити акаунт</li>
                  </ul>
                </div>

                {/* Header */}
                <div>
                  <h4 className={`flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-2`}>
                    <Bell className="w-5 h-5 text-red-500" />
                    Хедер
                  </h4>

                  <p className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                    В хедері користувачу доступні функції:
                  </p>

                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                    <li className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                      перегляду сповіщень
                    </li>
                    <li className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                      перемикання теми: світла/темна
                    </li>
                    <li className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                      перегляд часу
                    </li>
                    <li className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                      аватар користувача зі спливним меню, в якому міститься кнопка виходу з системи
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
