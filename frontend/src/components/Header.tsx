import { Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ScrollArea } from './ui/scroll-area';
import { Clock, Bell, Sun, Moon, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationContext';

interface HeaderProps {
  onNavigate: (screen: 'main' | 'upload' | 'realtime' | 'profile' | 'admin') => void;
}

export default function Header({ onNavigate }: HeaderProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, markAsRead, markAllAsRead, clearNotifications, unreadCount } = useNotifications();
  
  const [currentTime, setCurrentTime] = useState(() => {
    return new Date().toLocaleString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleString('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'Дрон': return 'bg-red-500 hover:bg-red-600';
      case 'Літак': return 'bg-blue-500 hover:bg-blue-600';
      case 'Вертоліт': return 'bg-green-500 hover:bg-green-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getSourceBadge = (source: string) => {
    return source === 'файл' 
      ? 'bg-purple-600 hover:bg-purple-700' 
      : 'bg-orange-600 hover:bg-orange-700';
  };

  return (
    <div
      className="w-full border-b shadow-md px-8 py-10"
      style={{
        paddingTop: "12px",
        paddingBottom: "12px",
        backgroundColor: theme === "dark"
          ? "oklch(.279 .041 260.031)"
          : "#ffffff",
        borderColor: theme === "dark"
          ? "oklch(.279 .041 260.031)"
          : "#e2e8f0"
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Logo / Title */}
        <div 
          className="cursor-pointer" 
          onClick={() => onNavigate('main')}
        >
          <h1 className={`text-2xl font-bold ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            СРЗЛА
          </h1>
          <p className={`text-xs ${
            theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
          }`}>
            Система розпізнавання звуків літальних апаратів
          </p>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">

          {/* Time */}
          <div className={`flex items-center gap-2 mr-4 ${
            theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
          }`}>
            <Clock className="w-5 h-5" />
            <span className="font-mono">{currentTime}</span>
          </div>

          {/* Theme Switch */}
          <Button
            onClick={toggleTheme}
            variant="ghost"
            size="icon"
            className={theme === 'dark'
              ? 'text-slate-200 hover:text-white hover:bg-slate-700'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`relative ${
                  theme === 'dark'
                    ? 'text-slate-200 hover:text-white hover:bg-slate-700'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>

            <PopoverContent
              className={`w-96 mr-4 shadow-xl ${
                theme === 'dark'
                  ? 'bg-slate-800 border-slate-700'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>
                    Сповіщення
                  </h3>

                  {notifications.length > 0 && (
                    <div className="flex gap-2">
                      <Button
                        onClick={markAllAsRead}
                        size="sm"
                        variant="ghost"
                        className={`text-xs ${
                          theme === 'dark'
                            ? 'text-blue-400 hover:text-blue-300'
                            : 'text-blue-600 hover:text-blue-700'
                        }`}
                      >
                        Прочитати всі
                      </Button>
                      <Button
                        onClick={clearNotifications}
                        size="sm"
                        variant="ghost"
                        className={`text-xs ${
                          theme === 'dark'
                            ? 'text-red-400 hover:text-red-300'
                            : 'text-red-600 hover:text-red-700'
                        }`}
                      >
                        Очистити
                      </Button>
                    </div>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      Тут будуть Ваші сповіщення
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-80">
                    <div className="space-y-2">
                      {notifications.map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => markAsRead(notif.id)}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            theme === 'dark'
                              ? notif.read
                                ? 'bg-slate-700'
                                : 'bg-slate-800 hover:bg-slate-700 border border-slate-600'
                              : notif.read
                                ? 'bg-slate-50'
                                : 'bg-blue-50 hover:bg-blue-100 border border-blue-100'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={`${getTypeBadgeColor(notif.type)} text-white text-xs`}>
                                  {notif.type}
                                </Badge>
                                <Badge className={`${getSourceBadge(notif.source)} text-white text-xs`}>
                                  {notif.source}
                                </Badge>
                              </div>
                              <p className={theme === 'dark' ? 'text-slate-200 text-sm' : 'text-slate-700 text-sm'}>
                                Впевненість: {notif.confidence.toFixed(1)}%
                              </p>
                              <p className={theme === 'dark' ? 'text-slate-400 text-xs' : 'text-slate-500 text-xs'}>
                                {notif.time}
                              </p>
                            </div>
                            {!notif.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* User Avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="focus:outline-none">
              <Avatar className="w-10 h-10 cursor-pointer hover:opacity-80 transition">
              <AvatarFallback className="w-full h-full rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-semibold">
                {user?.username[0].toUpperCase()}
              </AvatarFallback>
              </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className={`w-56 mr-6 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <DropdownMenuLabel className={theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}>
                {user?.username}
                {user?.role === 'admin' && (
                  <span className="ml-2 text-xs text-blue-400">(Адміністратор)</span>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className={theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'} />
              {user?.role === 'admin' ? (
                <DropdownMenuItem 
                  className={`cursor-pointer ${theme === 'dark' 
                    ? 'text-slate-200 focus:bg-slate-700 focus:text-white' 
                    : 'text-slate-700 focus:bg-slate-100 focus:text-slate-900'}`}
                  onClick={() => onNavigate('admin')}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Панель керування
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem 
                  className={`cursor-pointer ${theme === 'dark' 
                    ? 'text-slate-200 focus:bg-slate-700 focus:text-white' 
                    : 'text-slate-700 focus:bg-slate-100 focus:text-slate-900'}`}
                  onClick={() => onNavigate('profile')}
                >
                  <User className="w-4 h-4 mr-2" />
                  Мій профіль
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                className={`cursor-pointer ${theme === 'dark' 
                  ? 'text-slate-200 focus:bg-slate-700 focus:text-white' 
                  : 'text-slate-700 focus:bg-slate-100 focus:text-slate-900'}`}
                onClick={logout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Вийти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>
    </div>
  );
}
