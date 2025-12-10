import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ScrollArea } from './ui/scroll-area';
import { ArrowLeft, Trash2, PieChart, Activity, Power, Brain,AlertCircle} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { PieChart as RechartsPie, Pie, Cell, CartesianGrid } from 'recharts';
import { TrendingUp, Users, Clock } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip} from "recharts";


interface AdminPanelProps {
  onBack: () => void;
}

interface User {
  id: number;
  username: string;
  role: string;
  createdAt: string;
  lastLogin: string;
}

interface DbModel {
  id: number;
  name: string;
  description: string;
  isActive: number;
}

export default function AdminPanel({ onBack }: AdminPanelProps) {
  const { theme } = useTheme();
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/users")
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        console.log("Users from backend:", data);
      })
      .catch(err => console.error("Failed to load users:", err));
  }, []);

  useEffect(() => {
      fetch("http://127.0.0.1:5000/api/settings/realtime")
          .then(res => res.json())
          .then(data => setRealtimeEnabled(data.allow_realtime === true));
  }, []);

  type TopUser = {
    username: string;
    detectionsCount: number;
  };

  type Stats = {
    totalDetections: number;
    activeUsers: number;
    avgProcessingTime: number;
    topUsers: TopUser[];
  };

  // Передаємо тип у useState
  const [stats, setStats] = useState<Stats>({
    totalDetections: 0,
    activeUsers: 0,
    avgProcessingTime: 0,
    topUsers: [], // тепер TypeScript знає, що це TopUser[]
  });

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/stats")
      .then(res => res.json())
      .then((data: Stats) => setStats(data)) // явно типізуємо дані
      .catch(err => console.error(err));
  }, []);

  const [models, setModels] = useState<DbModel[]>([]);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/models")
      .then(res => res.json())
      .then(data => setModels(data))
      .catch(err => console.error("Failed to load models:", err));
  }, []);

  const toggleModel = (id: number) => {
    fetch(`http://127.0.0.1:5000/api/models/toggle/${id}`, {
      method: "PUT"
    })
      .then(res => res.json())
      .then(() => {
        fetch("http://127.0.0.1:5000/api/models")
          .then(res => res.json())
          .then((data: DbModel[]) => setModels(data));
      })
      .catch(err => console.error("Toggle error:", err));
  };

  const [saveLoading, setSaveLoading] = useState(false);
  const [dirty, setDirty] = useState(false); // позначка, що зміни не збережені
  const [systemStats, setSystemStats] = useState<any>(null);
  // Додати state для модалки
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const closeModal = () => setUserToDelete(null);

  const [aircraftTypeData, setAircraftTypeData] = useState<{name: string; value: number; color: string}[]>([]);
  const [sourceData, setSourceData] = useState<{name: string; value: number}[]>([]);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/statistics")
      .then(res => res.json())
      .then(data => {
        // Додаємо поле color кожному елементу
        const aircraftDataWithColors = data.aircraftTypeData.map((item: { name: string; }) => ({
          ...item,
          color:
            item.name === "drone" ? "#ef4444" :
            item.name === "airplane" ? "#3b82f6" :
            item.name === "helicopter" ? "#22c55e" :
            "#94a3b8"
        }));

        setAircraftTypeData(aircraftDataWithColors);
        setSourceData(data.sourceData);
      })
      .catch(err => console.error("Failed to load statistics:", err));
  }, []);


  const handleDeleteUser = (userId: number) => {
    fetch(`http://127.0.0.1:5000/api/users/delete/${userId}`, {
      method: "DELETE"
    })
      .then(res => res.json())
      .then(() => {
        setUsers(prev => prev.filter(u => u.id !== userId));
      })
      .catch(err => console.error("Failed to delete user:", err));
  };

  useEffect(() => {
  const loadStats = () => {
      fetch("http://127.0.0.1:5000/api/system/stats")
        .then(res => res.json())
        .then(data => setSystemStats(data))
        .catch(err => console.error("Failed to load system stats:", err));
    };

    loadStats(); // перше завантаження

    const interval = setInterval(loadStats, 30000); // оновлення кожні 30 сек

    return () => clearInterval(interval);
  }, []);

  const cardBg = theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const textPrimary = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const textSecondary = theme === 'dark' ? 'text-slate-400' : 'text-slate-600';
  const bgMain = theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50';
  
  return (
    <div className={`min-h-screen ${bgMain} p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={onBack}
              variant="ghost"
              size="icon"
              className={theme === 'dark' ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className={`text-3xl ${textPrimary}`}>Панель керування</h1>
              <p className={textSecondary}>Адміністрування системи розпізнавання літальних апаратів</p>
            </div>
          </div>
          
          {/* Системний статус */}
          <Card className={`${cardBg} p-4`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${realtimeEnabled ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                <Power className={`w-5 h-5 ${realtimeEnabled ? 'text-green-500' : 'text-red-500'}`} />
              </div>
              <div>
                <p className={`text-xs ${textSecondary}`}>Статус системи</p>
                <p className={textPrimary}>{realtimeEnabled ? 'Активна' : 'Вимкнена'}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className={theme === 'dark' ? 'bg-slate-800' : 'bg-white'}>
            <TabsTrigger value="users" className={theme === 'dark' ? 'data-[state=active]:bg-slate-700' : 'data-[state=active]:bg-slate-100'}>
              <Users className="w-4 h-4 mr-2" />
              Користувачі
            </TabsTrigger>
            <TabsTrigger value="statistics" className={theme === 'dark' ? 'data-[state=active]:bg-slate-700' : 'data-[state=active]:bg-slate-100'}>
              <PieChart className="w-4 h-4 mr-2" />
              Статистика
            </TabsTrigger>
            <TabsTrigger value="activity" className={theme === 'dark' ? 'data-[state=active]:bg-slate-700' : 'data-[state=active]:bg-slate-100'}>
              <Activity className="w-4 h-4 mr-2" />
              Активність
            </TabsTrigger>
            <TabsTrigger value="models" className={theme === 'dark' ? 'data-[state=active]:bg-slate-700' : 'data-[state=active]:bg-slate-100'}>
              <Brain className="w-4 h-4 mr-2" />
              Моделі
            </TabsTrigger>
            <TabsTrigger value="settings" className={theme === 'dark' ? 'data-[state=active]:bg-slate-700' : 'data-[state=active]:bg-slate-100'}>
              <Power className="w-4 h-4 mr-2" />
              Налаштування
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className={`${cardBg} p-6`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className={`text-xl ${textPrimary}`}>Управління користувачами</h2>
                  <p className={textSecondary}>Всього користувачів: {users.length}</p>
                </div>
              </div>
              
              <ScrollArea className="h-[500px]">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className={textPrimary}>Користувач</TableHead>
                    <TableHead className={textPrimary}>Роль</TableHead>
                    <TableHead className={textPrimary}>Остання авторизація</TableHead>
                    <TableHead className={textPrimary}>Дата реєстрації</TableHead>
                    <TableHead className={textPrimary}>Дії</TableHead>
                  </TableRow>
                </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className={textPrimary}>{user.username}</TableCell>
                        <TableCell className={textPrimary}>
                          {user.role === "admin" ? "Адміністратор" : "Користувач"}
                        </TableCell>
                        <TableCell className={textSecondary}>{user.lastLogin}</TableCell>
                        <TableCell className={textSecondary}>{user.createdAt}</TableCell>
                        <TableCell>
                          {user.username !== "admin" && (
                            <button
                              className="text-red-500 hover:text-red-600 p-1 rounded"
                              onClick={() => setUserToDelete(user)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </Card>
          </TabsContent>

                  {userToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className={`${cardBg} p-6 rounded-lg w-96`}>
              <h3 className={`text-lg mb-2 ${textPrimary}`}>Видалити користувача?</h3>
              <p className={`text-sm mb-4 ${textSecondary}`}>
                Ви дійсно хочете видалити {userToDelete.username}?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  onClick={closeModal}
                >
                  Скасувати
                </button>
                <button
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  onClick={() => {
                    handleDeleteUser(userToDelete.id);
                    closeModal();
                  }}
                >
                  Видалити
                </button>
              </div>
            </div>
          </div>
        )}

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-6">
            {/* Aircraft Types */}
            <Card className={`${cardBg} p-6`}>
              <h2 className={`text-xl mb-6 ${textPrimary}`}>Статистика по типах апаратів</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPie>
                    <Pie
                      data={aircraftTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {aircraftTypeData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                      <Tooltip />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {aircraftTypeData.map((item) => (
                    <div key={item.name} className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-50'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }} />
                          <span className={textPrimary}>{item.name}</span>
                        </div>
                        <span className={textPrimary}>{item.value} виявлень</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Sources */}
            <Card className={`${cardBg} p-6`}>
              <h2 className={`text-xl mb-6 ${textPrimary}`}>Статистика по джерелах</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={sourceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                  <XAxis dataKey="name" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} />
                  <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                      border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
                      color: theme === 'dark' ? '#ffffff' : '#000000'
                    }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
                {/* Верхні карточки */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card className={`${cardBg} p-4`}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className={`text-xs ${textSecondary}`}>Загальна кількість розпізнань</p>
                        <p className={`text-2xl ${textPrimary}`}>{stats.totalDetections}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className={`${cardBg} p-4`}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/20">
                        <Users className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className={`text-xs ${textSecondary}`}>Активних користувачів</p>
                        <p className={`text-2xl ${textPrimary}`}>{stats.activeUsers}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className={`${cardBg} p-4`}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/20">
                        <Clock className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <p className={`text-xs ${textSecondary}`}>Середній час роботи</p>
                        <p className={`text-2xl ${textPrimary}`}>{Math.round(stats.avgProcessingTime)}ms</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Топ-5 користувачів */}
                <Card className={`${cardBg} p-6`}>
                  <h2 className={`text-xl mb-4 ${textPrimary}`}>Найбільш активні користувачі</h2>
                  <ScrollArea className="h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className={textPrimary}>Користувач</TableHead>
                          <TableHead className={textPrimary}>Кількість розпізнань</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stats.topUsers.map((user, index) => (
                          <TableRow key={index}>
                            <TableCell className={textPrimary}>{user.username}</TableCell>
                            <TableCell className={textPrimary}>{user.detectionsCount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </Card>
              </TabsContent>

          {/* Models Tab */}
          <TabsContent value="models" className="space-y-6">

            <Card className={`${cardBg} p-6`}>
              <h2 className={`text-xl mb-6 ${textPrimary}`}>Список моделей</h2>

              <Table>
                <TableHeader>
                  <TableRow className={theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}>
                    <TableHead className={textPrimary}>Назва</TableHead>
                    <TableHead className={textPrimary}>Опис</TableHead>
                    <TableHead className={textPrimary}>Активна</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {models.map((model: DbModel) => (
                    <TableRow 
                      key={model.id}
                      className={theme === 'dark' ? 'border-slate-700' : 'border-slate-200'}
                    >
                      <TableCell className={textPrimary}>
                        {model.name}
                      </TableCell>

                      <TableCell className={textSecondary}>
                        {model.description}
                      </TableCell>

                      <TableCell>
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={model.isActive}
                            onChange={() => toggleModel(model.id)}
                          />
                        </label>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className={`${cardBg} p-6`}>
              <h2 className={`text-xl mb-6 ${textPrimary}`}>Налаштування системи</h2>
              
              <div className={`p-6 rounded-lg border ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${realtimeEnabled ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                      <Power className={`w-6 h-6 ${realtimeEnabled ? 'text-green-500' : 'text-red-500'}`} />
                    </div>
                    <div>
                      <h3 className={textPrimary}>Режим розпізнавання в реальному часі</h3>
                      <p className={textSecondary}>
                        {realtimeEnabled 
                          ? 'Система активно обробляє запити в реальному часі' 
                          : 'Система не приймає запити в реальному часі'}
                      </p>
                    </div>
                  </div>
                  <Checkbox
                    checked={realtimeEnabled}
                    onCheckedChange={(checked: boolean | "indeterminate") => {
                      const value = checked === true; // true якщо увімкнено

                      setRealtimeEnabled(value);
                      setDirty(true); // позначаємо, що є незбережені зміни
                          }}
                          className="w-6 h-6 border border-slate-400"
                      />
                      <Button
                        className="mt-4 bg-blue-600 hover:bg-blue-700"
                        disabled={!dirty || saveLoading}
                        onClick={() => {
                            setSaveLoading(true);

                            fetch("http://127.0.0.1:5000/api/settings/realtime", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ enabled: realtimeEnabled })
                            })
                            .then(() => {
                                setDirty(false);
                            })
                            .finally(() => setSaveLoading(false));
                        }}
                    >
                        {saveLoading ? "Збереження..." : "Зберегти зміни"}
                    </Button>
                </div>
              </div>

              {!realtimeEnabled && (
                <div className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${theme === 'dark' ? 'bg-orange-900/20 border border-orange-700' : 'bg-orange-50 border border-orange-200'}`}>
                  <AlertCircle className={`w-5 h-5 mt-0.5 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`} />
                  <div>
                    <p className={`${theme === 'dark' ? 'text-orange-300' : 'text-orange-800'}`}>
                      Увага! Режим реального часу вимкнено.
                    </p>
                    <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-700'}`}>
                      Користувачі не зможуть використовувати функцію моніторингу в реальному часі до його ввімкнення.
                    </p>
                  </div>
                </div>
              )}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className={`${theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'} p-4`}>
                  <h3 className={`mb-2 ${textPrimary}`}>Статистика системи</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className={textSecondary}>Загальний час роботи:</span>
                      <span className={textPrimary}>
                        {systemStats ? `${systemStats.uptime_hours} годин` : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={textSecondary}>Середній час відгуку:</span>
                      <span className={textPrimary}>
                         {systemStats ? `${systemStats.avg_response_ms} ms` : "—"}
                      </span>
                    </div>
                  </div>
                </Card>

                <Card className={`${theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'} p-4`}>
                  <h3 className={`mb-2 ${textPrimary}`}>Використання ресурсів</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className={textSecondary}>Використання CPU:</span>
                      <span className={textPrimary}>
                        {systemStats ? `${systemStats.cpu_backend}%` : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={textSecondary}>Використання GPU:</span>
                      <span className={textPrimary}>
                        {systemStats && systemStats.gpu_total_stats && systemStats.gpu_total_stats.length > 0
                          ? `${systemStats.gpu_total_stats[0].util_percent}% (${systemStats.gpu_total_stats[0].memory_used_gb} GB)`
                          : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={textSecondary}>Використання RAM:</span>
                      <span className={textPrimary}>
                        {systemStats ? `${systemStats.ram_backend_gb} GB / ${systemStats.ram_total_gb} GB` : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={textSecondary}>Мережевий трафік:</span>
                      <span className={textPrimary}>
                        {systemStats
                        ? `${systemStats.network_sent_gb} GB ↑ / ${systemStats.network_recv_gb} GB ↓`
                        : "—"}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
