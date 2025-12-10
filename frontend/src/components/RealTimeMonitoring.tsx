import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription } from './ui/alert';
import { ArrowLeft, Play, Square, Radio, AlertTriangle, Volume2, Download } from 'lucide-react';
import ModelSelector from './ModelSelector';
import { useTheme } from '../contexts/ThemeContext';

interface RealTimeLog {
  id: number;
  type: string;
  confidence: number;
  time: string;
}

interface RealTimeMonitoringProps {
  onBack: () => void;
}

export default function RealTimeMonitoring({ onBack }: RealTimeMonitoringProps) {
  const { theme } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [logs, setLogs] = useState<RealTimeLog[]>([]);
  const [signalStrength, setSignalStrength] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [selectedModel, setSelectedModel] = useState('custom');
  const logIdRef = useRef(1);
  const sendingRef = useRef(false); // prevent overlapping sends

  // Start recording & streaming
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      // ondataavailable triggers for each timeslice (we will use 3000 ms)
      mediaRecorder.ondataavailable = async (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          // avoid concurrent sends
          if (sendingRef.current) {
            // optionally queue or drop
            return;
          }
          sendingRef.current = true;
          await sendAudioToBackend(event.data);
          sendingRef.current = false;
        }
      };

      mediaRecorder.onerror = (ev) => {
        console.error("MediaRecorder error:", ev);
      };

      // Prepare analyser for signal level visualization
      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Start collecting audio every 3s
      mediaRecorder.start(3000); // timeslice: 3000 ms
      setIsRecording(true);
      updateSignalLoop();

    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Неможливо отримати доступ до мікрофона. Перевірте дозволи.");
    }
  };

  // Send Blob to backend analyze_stream
  const sendAudioToBackend = async (audioBlob: Blob) => {
    const formData = new FormData();
    // name 'audio' must match backend analyze_stream
    formData.append('audio', audioBlob, 'realtime.webm');

    try {
      const res = await fetch('http://127.0.0.1:5000/analyze_stream', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        console.error("Server response not OK:", res.status, res.statusText);
        // Optionally read error json
        try {
          const err = await res.json();
          console.error("Server error:", err);
        } catch { /* ignore */ }
        return;
      }

      const data = await res.json();
      const newLog: RealTimeLog = {
        id: logIdRef.current++,
        type: data.result,
        confidence: data.confidence,
        time: new Date().toLocaleTimeString('uk-UA'),
      };
      setLogs(prev => [newLog, ...prev]);
    } catch (err) {
      console.error("Send audio error:", err);
    }
  };

  // Visualizer loop to update signalStrength
  const updateSignalLoop = () => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const loop = () => {
      if (!isRecording || !analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);
      // compute average magnitude and scale to 0..100
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      const level = Math.min(100, Math.max(0, avg / 2)); // simple normalization
      setSignalStrength(level);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  };

  // Stop recording & cleanup
  const stopRecording = () => {
    setIsRecording(false);
    // stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) { /* ignore */ }
      mediaRecorderRef.current = null;
    }
    // stop audio tracks
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(t => t.stop());
      audioStreamRef.current = null;
    }
    // close audio context
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
      analyserRef.current = null;
    }
    setSignalStrength(0);
  };

  useEffect(() => {
    // cleanup on unmount
    return () => {
      stopRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getTypeBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'drones': return 'bg-red-500 hover:bg-red-600';
      case 'airplanes': return 'bg-blue-500 hover:bg-blue-600';
      case 'helicopter': return 'bg-green-500 hover:bg-green-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 95) {
      return <Badge className="bg-green-600 hover:bg-green-700">Висока</Badge>;
    } else if (confidence >= 90) {
      return <Badge className="bg-yellow-600 hover:bg-yellow-700">Середня</Badge>;
    } else {
      return <Badge className="bg-orange-600 hover:bg-orange-700">Низька</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white text-3xl mb-2">Моніторинг у реальному часі</h1>
              <p className="text-slate-300">Безперервний аналіз акустичних сигналів</p>
            </div>
            <div className="flex items-center gap-3">
              {isRecording && (
                <div className="flex items-center gap-2 animate-pulse">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-red-400">В ЕФІРІ</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Control Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6 bg-slate-800 border-slate-700">
              <h3 className="text-white text-lg mb-4">Панель управління</h3>

              {/* Model Selector */}
              <ModelSelector 
                value={selectedModel} 
                onChange={setSelectedModel}
                className="mb-6"
              />

              {/* Control Buttons */}
              <div className="space-y-3 mb-6">
                {!isRecording ? (
                  <Button
                    onClick={startRecording}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    size="lg"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Почати аналіз
                  </Button>
                ) : (
                  <Button
                    onClick={stopRecording}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                    size="lg"
                  >
                    <Square className="w-5 h-5 mr-2" />
                    Зупинити
                  </Button>
                )}
              </div>

              {/* Signal Strength */}
              {isRecording && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-300">Рівень сигналу:</span>
                    <span className="text-white">{signalStrength.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-300"
                      style={{ width: `${signalStrength}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                  <span className="text-slate-300">Статус:</span>
                  <span className="text-white">{isRecording ? 'Активний' : 'Неактивний'}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                  <span className="text-slate-300">Виявлень:</span>
                  <span className="text-white">{logs.length}</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-slate-800 border-slate-700">
              <div className="flex flex-col items-center">
                <div className={`w-32 h-32 rounded-full flex items-center justify-center ${isRecording ? 'bg-gradient-to-br from-purple-600 to-blue-600 animate-pulse' : 'bg-slate-700'}`}>
                  {isRecording ? <Radio className="w-16 h-16 text-white" /> : <Volume2 className="w-16 h-16 text-slate-400" />}
                </div>
                <p className="text-slate-300 mt-4 text-center">{isRecording ? 'Прослуховування активне' : 'Очікування запуску'}</p>
              </div>
            </Card>
          </div>

          {/* Logs Panel */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-slate-800 border-slate-700 h-[600px] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-lg">Логи виявлень</h3>
                {logs.length > 0 && (
                  <Button onClick={() => setLogs([])} variant="outline" size="sm" className="bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600 hover:text-white">
                    Очистити
                  </Button>
                )}
              </div>

              {logs.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Radio className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">{isRecording ? 'Очікування виявлення літальних апаратів...' : 'Натисніть "Почати аналіз" для початку моніторингу'}</p>
                  </div>
                </div>
              ) : (
                <ScrollArea className="flex-1">
                  <div className="space-y-3">
                    {logs.map((log) => (
                      <Alert key={log.id} className={`${log.confidence >= 95 ? 'bg-red-900/30 border-red-700' : 'bg-slate-700 border-slate-600'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {log.confidence >= 95 && <AlertTriangle className="h-5 w-5 text-red-400" />}
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={`${getTypeBadgeColor(log.type)} text-white`}>{log.type}</Badge>
                                {getConfidenceBadge(log.confidence)}
                              </div>
                              <AlertDescription className="text-slate-200">Виявлено: {log.type} | Впевненість: {log.confidence.toFixed(1)}%</AlertDescription>
                            </div>
                          </div>
                          <span className="text-slate-300 text-sm">{log.time}</span>
                        </div>
                      </Alert>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
