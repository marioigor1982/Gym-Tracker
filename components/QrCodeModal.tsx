import React from 'react';
import type { WorkoutSession } from '../types';
import { XIcon } from './icons';

interface QrCodeModalProps {
  session: WorkoutSession;
  onClose: () => void;
}

const formatDurationForQR = (ms: number) => {
    if (ms < 0) ms = 0;
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    let result = '';
    if (hours > 0) result += `${hours}h `;
    result += `${minutes}m`;
    return result;
};
  
const formatStopwatchTimeForQR = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const QrCodeModal: React.FC<QrCodeModalProps> = ({ session, onClose }) => {
    const generateWorkoutSummary = (session: WorkoutSession): string => {
        let summary = `** Treino: ${session.name} **\n`;
        summary += `Data: ${new Date(session.startTime).toLocaleDateString('pt-BR')}\n`;
        summary += `Duração: ${formatDurationForQR((session.endTime || session.startTime) - session.startTime)}\n\n`;

        session.exercises.forEach(ex => {
            summary += `* ${ex.name}\n`;
            if (ex.isCardio) {
                const completedLog = ex.logs.find(log => log.completed);
                if (completedLog) {
                    summary += `  - Tempo: ${formatStopwatchTimeForQR(completedLog.reps)}\n`;
                }
            } else {
                ex.logs.forEach((log, index) => {
                    if (log.completed) {
                        summary += `  - Série ${index + 1}: ${log.weight}kg x ${log.reps} reps\n`;
                    }
                });
            }
            summary += `\n`;
        });

        return summary;
    };

    const workoutSummary = generateWorkoutSummary(session);
    const encodedData = encodeURIComponent(workoutSummary);
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodedData}&qzone=1`;

    return (
        <div
        className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[60] p-4 animate-fade-in-up"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
        onClick={onClose}
        >
        <div
            className="bg-gray-800 rounded-lg shadow-xl w-full max-w-sm text-center p-8 relative"
            role="document"
            onClick={(e) => e.stopPropagation()}
        >
            <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors"
            aria-label="Fechar"
            >
            <XIcon />
            </button>
            <h2 id="modal-title" className="text-2xl font-bold text-blue-400 mb-2">{session.name}</h2>
            <p className="text-gray-400 mb-6">Escaneie o código para ver o resumo deste treino.</p>
            <div className="bg-white p-4 rounded-lg inline-block shadow-md">
            <img src={qrCodeUrl} alt={`QR Code for ${session.name}`} width="250" height="250" />
            </div>
        </div>
        </div>
    );
};

export default QrCodeModal;