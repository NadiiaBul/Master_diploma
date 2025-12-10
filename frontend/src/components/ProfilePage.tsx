import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Clock, Bell, Lock, Trash2, AlertTriangle, CheckCircle2, Save, ArrowLeft } from 'lucide-react';

interface ProfilePageProps {
  onBack: () => void;
  sessionStartTime: number | null;
}

export default function ProfilePage({ onBack, sessionStartTime }: ProfilePageProps) {
  const { user, logout } = useAuth();
  const { theme } = useTheme();

  const [sessionDuration, setSessionDuration] = useState('00:00:00');
  const [confidenceThreshold, setConfidenceThreshold] = useState('90');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ---- SESSION TIMER ----
  useEffect(() => {
    if (!sessionStartTime) return;

    const update = () => {
      const elapsed = Date.now() - sessionStartTime;
      const h = Math.floor(elapsed / 3600000);
      const m = Math.floor((elapsed % 3600000) / 60000);
      const s = Math.floor((elapsed % 60000) / 1000);

      setSessionDuration(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    };

    update(); // одразу виставляємо правильний час при відкритті сторінки
    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);
  }, [sessionStartTime]);
  
  useEffect(() => {
    const saved = localStorage.getItem("confidenceThreshold");
    if (saved) {
      setConfidenceThreshold(saved);
    }
  }, []);

  // ---- PASSWORD CHANGE ----
  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      alert('Паролі не збігаються!');
      return;
    }
    if (newPassword.length < 4) {
      alert('Пароль має містити мінімум 4 символи');
      return;
    }

    if (!user?.UserID) {
      alert("Не знайдено користувача");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:5000/api/change_password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.UserID,
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "Помилка при зміні пароля");
        return;
      }

      setPasswordChanged(true);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordChanged(false), 2500);
    } catch (err) {
      console.error(err);
      alert("Помилка сервера");
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem("confidenceThreshold", confidenceThreshold);
    setSettingsSaved(true);

    setTimeout(() => setSettingsSaved(false), 2000);
  };

  const handleDeleteAccount = async () => {
    if (!user?.UserID) {
      alert("Не знайдено користувача");
      return;
    }

    if (!confirm("Ви впевнені, що хочете видалити акаунт?")) return;

    try {
      const res = await fetch("http://127.0.0.1:5000/api/delete_account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.UserID }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "Помилка при видаленні акаунта");
        return;
      }

      alert("Акаунт видалено!");
      logout(); // Вихід з системи
      // автоматично повертаємо на головну або login
      onBack();
    } catch (err) {
      console.error(err);
      alert("Помилка сервера");
    }
  };

  return (
    <div
      className={`min-h-screen p-6 ${
        theme === 'dark'
          ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
          : 'bg-gradient-to-br from-blue-50 via-white to-blue-50'
      }`}
    >
      <div className="max-w-3xl mx-auto">

        {/* Back button */}
        <Button
          variant="ghost"
          className={`mb-8 ${
            theme === 'dark'
              ? 'text-slate-300 hover:text-white hover:bg-slate-800'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          onClick={onBack}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад до головної
        </Button>

        <Card className={`border-0 shadow-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
          <CardHeader className="pb-6">
            <CardTitle className={`text-3xl ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Налаштування профілю
            </CardTitle>
            <CardDescription className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>
              Керуйте налаштуваннями вашого облікового запису та системи
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-14">

            {/* SESSION BLOCK */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Тривалість сесії
                </h3>
              </div>

              <div className={`rounded-lg p-6 ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'}`}>
                <div className="flex items-center justify-between">
                  <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>Поточна сесія:</span>
                  <span
                    className={`text-3xl font-mono font-bold ${
                      theme === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {sessionDuration}
                  </span>
                </div>
              </div>
            </div>

            <Separator className="my-10" />
            <br/><br/>
            {/* NOTIFICATIONS */}
            <div className="space-y-6 mt-12">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-yellow-500" />
                <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Налаштування сповіщень
                </h3>
              </div>

              <div
                className={`p-6 rounded-lg border ${
                  theme === 'dark'
                    ? 'border-slate-700 bg-slate-800/50'
                    : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                <div className="space-y-4">
                  <Label className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                    Поріг впевненості (%)
                  </Label>

                  <div className="flex gap-3 items-center">
                    <Input
                      type="number"
                      value={confidenceThreshold}
                      min={0}
                      max={100}
                      onChange={(e) => setConfidenceThreshold(e.target.value)}
                      className={`w-24 ${
                        theme === 'dark'
                          ? 'bg-slate-700 border-slate-600 text-white'
                          : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                    <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>%</span>
                  </div>

                  <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSaveSettings}>
                    <Save className="w-4 h-4 mr-2" /> Зберегти
                  </Button>

                  {settingsSaved && (
                    <Alert className="bg-green-500/10 border-green-500/20 mt-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-600">
                        Налаштування успішно збережено!
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </div>

            <Separator className="my-10" />
            <br/><br/>

            {/* PASSWORD CHANGE */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-green-500" />
                <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Зміна пароля
                </h3>
              </div>

              <div
                className={`p-6 rounded-lg border ${
                  theme === 'dark'
                    ? 'border-slate-700 bg-slate-800/50'
                    : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                {passwordChanged && (
                  <Alert className="bg-green-500/10 border-green-500/20 mb-4">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-600">Пароль змінено!</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-6 max-w-md">
                  <div>
                    <Label className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                      Старий пароль
                    </Label>
                    <br/>
                    <Input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className={`mt-2 ${
                        theme === 'dark'
                          ? 'bg-slate-700 border-slate-600 text-white'
                          : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <Label className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                      Новий пароль
                    </Label>
                    <br/>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`mt-2 ${
                        theme === 'dark'
                          ? 'bg-slate-700 border-slate-600 text-white'
                          : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <Label className={theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>
                      Підтвердити пароль
                    </Label>
                    <br/>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`mt-2 ${
                        theme === 'dark'
                          ? 'bg-slate-700 border-slate-600 text-white'
                          : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <Button
                    onClick={handlePasswordChange}
                    disabled={!oldPassword || !newPassword || !confirmPassword}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Змінити пароль
                  </Button>
                </div>
              </div>
            </div>

            <Separator className="my-10" />
            <br/><br/>

            {/* DANGER ZONE */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-500" />
                <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Видалення акаунту
                </h3>
              </div>

              <div
                className={`p-6 rounded-lg border ${
                  theme === 'dark'
                    ? 'border-slate-700 bg-slate-800/50'
                    : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                {!showDeleteConfirm ? (
                  <div className="flex items-start justify-between gap-4">
                    <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
                      Видалення акаунта незворотне.
                    </p>
                    <Button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="bg-red-500/10 text-red-600 hover:bg-red-500/20"
                      variant="outline"
                    >
                      Видалити акаунт
                    </Button>
                  </div>
                ) : (
                  <Alert className="bg-red-500/10">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <AlertDescription className="space-y-3">
                      <p className="text-red-500 font-medium">Ви впевнені?</p>
                      <div className="flex gap-3">
                        <Button
                          onClick={handleDeleteAccount}
                          className="bg-red-600 hover:bg-red-700 text-white"
                          size="sm"
                        >
                          Так, видалити
                        </Button>
                        <Button
                          onClick={() => setShowDeleteConfirm(false)}
                          variant="outline"
                          size="sm"
                        >
                          Скасувати
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
