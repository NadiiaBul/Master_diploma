import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Radio, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: { UserID: number; username: string; role: 'admin' | 'user' }) => void;
  setSessionStartTime: (time: number) => void; // <--- додаємо пропс
}

export default function LoginScreen({ onLogin, setSessionStartTime }: LoginScreenProps) {
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [error, setError] = useState('');

  // ---- LOGIN ----
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!loginUsername || !loginPassword) {
      setError("Будь ласка, заповніть усі поля");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword
        })
      });

      const data = await res.json();

      if (!data.success) {
        if (data.error === "user_not_found") setError("Користувача не знайдено");
        if (data.error === "wrong_password") setError("Неправильний пароль");
        return;
      }

      onLogin({
        UserID: data.UserID,
        username: data.username,
        role: data.role
      });
      setSessionStartTime(Date.now());
      localStorage.setItem("userId", data.UserID.toString());
      localStorage.setItem("role", data.role);

    } catch {
      setError("Помилка сервера");
    }
  };


  // ---- REGISTRATION ----
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!registerUsername || !registerPassword || !registerConfirmPassword) {
      setError("Будь ласка, заповніть усі поля");
      return;
    }
    if (registerPassword !== registerConfirmPassword) {
      setError("Паролі не співпадають");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: registerUsername,
          password: registerPassword
        })
      });

      const data = await res.json();

      if (!data.success) {
        if (data.error === "username_taken") {
          setError("Такий логін вже існує");
        }
        return;
      }

      // УСПІШНА РЕЄСТРАЦІЯ → АВТОМАТИЧНИЙ ЛОГІН  
      onLogin({
        UserID: data.UserID,
        username: registerUsername,
        role: registerUsername === "admin" ? "admin" : "user"
      });

      setSessionStartTime(Date.now());
      localStorage.setItem("userId", data.UserID.toString());
      localStorage.setItem("role", data.role);

    } catch {
      setError("Помилка сервера");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-4">
            <Radio className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-white text-3xl mb-2">
            Система розпізнавання літальних апаратів
          </h1>
          <p className="text-slate-300">Аналіз акустичних сигнатур<br/></p>
          <br/>
        </div>

        <Card className="p-6 bg-slate-800 border-slate-700">
          <Tabs defaultValue="login" className="w-full">

            {/* TABS */}
            <TabsList className="flex w-full bg-slate-800 border border-slate-700 rounded-md">
              <TabsTrigger
                value="login"
                className="flex-1 px-4 py-2 text-slate-300 rounded-md transition
                           data-[state=active]:bg-slate-700 
                           data-[state=active]:text-white
                           hover:bg-slate-700/50"
              >
                Вхід
              </TabsTrigger>

              <TabsTrigger
                value="register"
                className="flex-1 px-4 py-2 text-slate-300 rounded-md transition
                           data-[state=active]:bg-slate-700 
                           data-[state=active]:text-white
                           hover:bg-slate-700/50"
              >
                Реєстрація
              </TabsTrigger>
            </TabsList>

            {/* LOGIN FORM */}
            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleLogin} className="space-y-4">

                <div className="space-y-3">
                  <Label htmlFor="login-username" className="text-slate-200">
                    Логін
                  </Label>
                  <Input
                    id="login-username"
                    type="text"
                    placeholder="Введіть логін"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="login-password" className="text-slate-200">
                    Пароль
                  </Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Введіть пароль"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>

                {error && (
                  <Alert className="bg-red-900/30 border-red-700">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-200">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  Увійти
                </Button>
              </form>
            </TabsContent>

            {/* REGISTRATION FORM */}
            <TabsContent value="register" className="mt-6">
              <form onSubmit={handleRegister} className="space-y-4">

                <div className="space-y-3">
                  <Label htmlFor="register-username" className="text-slate-200">
                    Логін
                  </Label>
                  <Input
                    id="register-username"
                    type="text"
                    placeholder="Оберіть логін"
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="register-password" className="text-slate-200">
                    Пароль
                  </Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Оберіть пароль"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="register-confirm-password" className="text-slate-200">
                    Підтвердіть пароль
                  </Label>
                  <Input
                    id="register-confirm-password"
                    type="password"
                    placeholder="Повторіть пароль"
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>

                {error && (
                  <Alert className="bg-red-900/30 border-red-700">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-200">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  Зареєструватися
                </Button>

                <div className="text-center text-sm text-slate-400 mt-4">
                  <p>Нові користувачі отримують звичайний доступ</p>
                </div>

              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
