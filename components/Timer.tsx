
import React, { useState, useEffect } from 'react';

interface TimerProps {
  initialSeconds: number;
  onComplete: () => void;
  isRunning: boolean;
}

const Timer: React.FC<TimerProps> = ({ initialSeconds, onComplete, isRunning }) => {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds, isRunning]);

  useEffect(() => {
    if (!isRunning) return;

    if (seconds <= 0) {
      onComplete();
      return;
    }

    const intervalId = setInterval(() => {
      setSeconds(s => s - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [seconds, onComplete, isRunning]);

  const formatTime = () => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  if (!isRunning) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-blue-600 text-white p-4 z-50 text-center shadow-lg animate-fade-in-up">
      <h3 className="text-xl font-bold uppercase tracking-wider">Tempo de Descanso</h3>
      <p className="text-4xl font-mono tracking-widest">{formatTime()}</p>
    </div>
  );
};

export default Timer;
