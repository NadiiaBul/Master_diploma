import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { ArrowLeft, Upload, FileAudio, AlertCircle, CheckCircle2, Loader2, Play, Pause, Download } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import ModelSelector from './ModelSelector';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationContext';

function convertResultToType(label: string): "Дрон" | "Літак" | "Вертоліт" {
  if (label === "drone") return "Дрон";
  if (label === "airplane") return "Літак";
  if (label === "helicopter") return "Вертоліт";
  return "Дрон"; 
}

interface AudioFileUploadProps {
  onBack: () => void;
}

type AircraftType = 'Дрон' | 'Літак' | 'Вертоліт' | null;

export default function AudioFileUpload({ onBack }: AudioFileUploadProps) {
  const { theme } = useTheme();
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [result, setResult] = useState<AircraftType>(null);
  const [confidence, setConfidence] = useState(0);
  const [processingTime, setProcessingTime] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('custom');
  const [usedModel, setUsedModel] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { addNotification } = useNotifications();


  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files[0]) {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setAnalyzed(false);
    setResult(null);

    // Створити URL для програвання
    const url = URL.createObjectURL(selectedFile);
    setAudioUrl(url);
  }
};


const handleAnalyze = async () => {
  if (!file) return;
  setAnalyzing(true);
  const startTime = Date.now();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("model", selectedModel);

  try {
    const response = await fetch("http://127.0.0.1:5000/analyze", {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw new Error("Помилка при запиті до бекенду");

    const data = await response.json();

    setResult(data.result);
    setConfidence(data.confidence);
    setProcessingTime(Date.now() - startTime);
    setUsedModel(data.model);

    // ---------- НОВИЙ КОД: запис у базу ----------
    const logResponse = await fetch("http://127.0.0.1:5000/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        UserID: Number(localStorage.getItem("userId")), // або пропс із LoginScreen
        AircraftTypeID: data.aircraftTypeID, // відповідно до mapping label→id
        Confidence: data.confidence,
        SourceType: "file",
        ProcessingTimeMs: Date.now() - startTime
      })
    });

    const logData = await logResponse.json();
    console.log("Log збережено:", logData);
    // --------------------------------------------
  } catch (error) {
    console.error("Помилка:", error);
    alert("Не вдалося виконати аналіз аудіо.");
  } finally {
    setAnalyzing(false);
    setAnalyzed(true);
  }
};


  const handleReset = () => {
    setFile(null);
    setAnalyzed(false);
    setResult(null);
    setConfidence(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
 
const handlePlay = () => {
  if (audioRef.current) {
    audioRef.current.play();
    setIsPlaying(true);
  }
};

const handlePause = () => {
  if (audioRef.current) {
    audioRef.current.pause();
    setIsPlaying(false);
  }
};

const handleAudioEnded = () => {
  setIsPlaying(false);
};

const handleDownloadLog = () => {
  if (!file || !result) return;

  const currentDate = new Date().toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const logContent = `
ФАЙЛ: ${file.name}
Розмір: ${(file.size / 1024 / 1024).toFixed(2)} MB
Тип: ${file.type}

РЕЗУЛЬТАТ:
- Тип: ${result}
- Використана модель: ${usedModel}
- Впевненість: ${confidence.toFixed(1)}%
- Час обробки: ${processingTime} мс
Дата аналізу: ${currentDate}
`;

  const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `log_${file.name.replace(/\.[^/.]+$/, '')}.txt`;
  link.click();

  URL.revokeObjectURL(url);
};


const getAircraftImage = (type: string) => {
  switch (type.toLowerCase()) {
    case 'drone':
    case 'дрон':
      return '/images/drones.jpg';
    case 'airplane':
    case 'літак':
      return '/images/airplanes.jpg';
    case 'helicopter':
    case 'вертоліт':
      return '/images/helicopter.jpg';
    default:
      return '/images/default.jpg'; 
  }
};


  const getResultColor = (type: AircraftType) => {
    switch (type) {
      case 'Дрон': return 'text-red-400';
      case 'Літак': return 'text-blue-400';
      case 'Вертоліт': return 'text-green-400';
      default: return 'text-slate-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            onClick={onBack}
            variant="ghost"
            className="text-slate-200 hover:text-white hover:bg-slate-800 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Повернутися назад
          </Button>
          <h1 className="text-white text-3xl mb-2">
            Аналіз аудіо-файлу
          </h1>
          <p className="text-slate-300">
            Завантажте аудіо-файл для розпізнавання літального апарата
          </p>
        </div>

        {!analyzed ? (
          <Card className="p-8 bg-slate-800 border-slate-700">
              {/* Model Selector */}
            <ModelSelector 
              value={selectedModel} 
              onChange={setSelectedModel}
              className="mb-6"
            />
            {/* File Upload Area */}
            <div className="mb-6">
              <div
                className="border-2 border-dashed border-slate-600 rounded-lg p-12 text-center hover:border-slate-500 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {!file ? (
                  <>
                    <Upload className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-200 text-lg mb-2">
                      Натисніть для вибору аудіо-файлу
                    </p>
                    <p className="text-slate-400">
                      Підтримувані формати: MP3, WAV, OGG
                    </p>
                  </>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <FileAudio className="w-12 h-12 text-blue-400" />
                    <div className="text-left">
                      <p className="text-white text-lg">{file.name}</p>
                      <p className="text-slate-300">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Info Alert */}
            <Alert className="mb-6 bg-slate-700 border-slate-600">
              <AlertCircle className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-slate-200">
                Після завантаження файлу натисніть "Аналізувати" для запуску розпізнавання.
                Процес може зайняти кілька секунд.
              </AlertDescription>
            </Alert>

            {/* Analyzing State */}
            {analyzing && (
              <div className="mb-6">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                  <span className="text-slate-200">Аналіз аудіо-файлу...</span>
                </div>
                <Progress value={60} className="h-2" />
              </div>
            )}

            {/* Analyze Button */}
            <Button
              onClick={handleAnalyze}
              disabled={!file || analyzing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              size="lg"
            >
              {analyzing ? 'Аналіз...' : 'Аналізувати'}
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Success Alert */}
            <Alert className="bg-green-900/30 border-green-700">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <AlertDescription className="text-green-200">
                Аналіз завершено успішно за {processingTime} мс
              </AlertDescription>
            </Alert>

            {/* Result Card */}
            <Card className="p-8 bg-slate-800 border-slate-700">
              <div className="text-center mb-6">
                <h2 className="text-slate-300 text-lg mb-2">Результат розпізнавання:</h2>
                <h3 className={`text-4xl mb-4 ${getResultColor(result)}`}>
                  {result || 'Звуків літальних апаратів не виявлено'}
                </h3>
                
                {result && (
                  <>
                    <div className="mb-6">
                      <p className="text-slate-400 text-sm mb-1">
                        Використана модель: <span className="text-white font-medium">{usedModel}</span>
                      </p>

                      <p className="text-slate-300 mb-2">Впевненість моделі:</p>
                      <div className="flex items-center justify-center gap-4">
                        <Progress value={confidence} className="w-64 h-3" />
                        <span className="text-white text-2xl">
                          {confidence.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Aircraft Image */}
                    <div className="max-w-md mx-auto rounded-lg overflow-hidden">
                      <ImageWithFallback
                        src={getAircraftImage(result)}
                        alt={result}
                        className="w-full h-64 object-cover"
                      />
                      {audioUrl && (
                      <div className="bg-slate-700 rounded-lg p-4 max-w-md mx-auto mt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Button
                              onClick={isPlaying ? handlePause : handlePlay}
                              variant="ghost"
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                            </Button>

                            <div className="text-left">
                              <p className="text-white text-sm">Прослухати аудіо</p>
                              <p className="text-slate-400 text-xs">{file?.name}</p>
                            </div>
                          </div>
                        </div>

                        <audio
                          ref={audioRef}
                          src={audioUrl}
                          onEnded={handleAudioEnded}
                          className="hidden"
                        />
                      </div>
                    )}
                    </div>
                  </>
                )}
              </div>

              {/* Additional Info */}
              {result && (
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-700">
                  <div className="text-center">
                    <p className="text-slate-300 text-sm">Файл</p>
                    <p className="text-white">{file?.name}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-300 text-sm">Час обробки</p>
                    <p className="text-white">{processingTime} мс</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-300 text-sm">Точність моделі</p>
                    <p className="text-white">{confidence}</p>
                  </div>
                </div>
              )}
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={handleReset}
                variant="outline"
                className="flex-1 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                size="lg"
              >
                Аналізувати інший файл
              </Button>

              <Button
                onClick={onBack}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                Повернутися до головного меню
              </Button>

              <Button
                onClick={handleDownloadLog}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                <Download className="w-5 h-5 mr-2" />
                Завантажити лог
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
function setLogId(log_id: any) {
  throw new Error('Function not implemented.');
}

