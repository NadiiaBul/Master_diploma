import { useState } from 'react';
import MainScreen from './components/MainScreen';
import AudioFileUpload from './components/AudioFileUpload';
import RealTimeMonitoring from './components/RealTimeMonitoring';
import LoginScreen from './components/LoginScreen';
import Header from './components/Header';
import ProfilePage from './components/ProfilePage';
import AdminPanel from './components/AdminPanel';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';

type Screen = 'main' | 'upload' | 'realtime' | 'profile' | 'admin';

function AppContent() {
  const { user, login } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('main');

  // Додаємо state для початку сесії
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  // Якщо не залогінений — показуємо LoginScreen та передаємо setSessionStartTime
  if (!user) {
    return (
      <LoginScreen 
        onLogin={login}
        setSessionStartTime={setSessionStartTime}
      />
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'main':
        return <MainScreen onNavigate={setCurrentScreen} />;
      case 'upload':
        return <AudioFileUpload onBack={() => setCurrentScreen('main')} />;
      case 'realtime':
        return <RealTimeMonitoring onBack={() => setCurrentScreen('main')} />;
      case 'profile':
        return (
          <ProfilePage 
            onBack={() => setCurrentScreen('main')} 
            sessionStartTime={sessionStartTime} 
          />
        );
      case 'admin':
        return <AdminPanel onBack={() => setCurrentScreen('main')} />;
      default:
        return <MainScreen onNavigate={setCurrentScreen} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onNavigate={setCurrentScreen} />
      <main className="flex-1">
        {renderScreen()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}