import React, { useState, useMemo } from 'react';
import type { WorkoutSession } from '../types';
import { ChartBarIcon, ClockIcon, DumbbellIcon, XIcon, TrashIcon, HeartIcon } from './icons';
import Calendar from './Calendar';

interface DashboardProps {
  history: WorkoutSession[];
  onReset: () => void;
}

const formatDuration = (ms: number) => {
  if (ms < 0) ms = 0;
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  let result = '';
  if (hours > 0) result += `${hours}h `;
  result += `${minutes}m`;
  return result;
};

const Dashboard: React.FC<DashboardProps> = ({ history, onReset }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const stats = React.useMemo(() => {
    const totalWorkouts = history.length;
    
    const totalDuration = history.reduce((acc, session) => {
      const endTime = session.endTime || session.startTime;
      return acc + (endTime - session.startTime);
    }, 0);

    const totalWeightLifted = history.reduce((acc, session) => {
      let sessionWeight = 0;
      session.exercises.forEach(ex => {
        ex.logs.forEach(log => {
          if (log.completed && log.weight && log.reps && !ex.isCardio) {
            sessionWeight += log.weight * log.reps;
          }
        });
      });
      return acc + sessionWeight;
    }, 0);

    const totalCardioTimeInSeconds = history.reduce((acc, session) => {
        let sessionCardioTime = 0;
        session.exercises.forEach(ex => {
            if (ex.isCardio) {
                ex.logs.forEach(log => {
                    if (log.completed) {
                        sessionCardioTime += log.reps; // log.reps stores duration in seconds for cardio
                    }
                });
            }
        });
        return acc + sessionCardioTime;
    }, 0);

    return { 
        totalWorkouts, 
        totalDuration, 
        totalWeightLifted, 
        totalCardioTime: totalCardioTimeInSeconds * 1000 // Convert to milliseconds for formatDuration
    };
  }, [history]);
  
  const workoutDays = useMemo(() => {
    const dates = new Set<string>();
    history.forEach(session => {
        dates.add(new Date(session.startTime).toDateString());
    });
    return dates;
  }, [history]);

  const selectedDateSessions = useMemo(() => {
    if (!selectedDate) return [];
    return history.filter(session =>
        new Date(session.startTime).toDateString() === selectedDate.toDateString()
    ).reverse(); // Show latest first
  }, [history, selectedDate]);


  if (history.length === 0) {
    return (
      <div className="text-center p-10 mt-10 bg-gray-800 rounded-lg max-w-lg mx-auto">
        <ChartBarIcon className="h-12 w-12 text-blue-500 mx-auto" />
        <h2 className="mt-4 text-2xl font-semibold">Nenhum dado de progresso</h2>
        <p className="mt-2 text-gray-400">Complete alguns treinos para ver suas estatísticas aqui!</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Painel de Progresso</h1>
        <p className="text-lg text-gray-400">Acompanhe sua jornada fitness.</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex items-center gap-4">
          <ChartBarIcon className="h-10 w-10 text-green-400" />
          <div>
            <p className="text-gray-400 text-sm">Total de Treinos</p>
            <p className="text-3xl font-bold">{stats.totalWorkouts}</p>
          </div>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex items-center gap-4">
          <ClockIcon className="h-10 w-10 text-yellow-400" />
          <div>
            <p className="text-gray-400 text-sm">Duração Total</p>
            <p className="text-3xl font-bold">{formatDuration(stats.totalDuration)}</p>
          </div>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex items-center gap-4">
          <HeartIcon className="h-10 w-10 text-pink-400" />
          <div>
            <p className="text-gray-400 text-sm">Tempo de Cardio</p>
            <p className="text-3xl font-bold">{formatDuration(stats.totalCardioTime)}</p>
          </div>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex items-center gap-4">
          <DumbbellIcon className="h-10 w-10 text-red-400" />
          <div>
            <p className="text-gray-400 text-sm">Peso Total Levantado</p>
            <p className="text-3xl font-bold">{stats.totalWeightLifted.toLocaleString('pt-BR')} kg</p>
          </div>
        </div>
      </div>
      
      {/* Calendar Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Calendário de Atividades</h2>
        <div className="bg-gray-800 rounded-lg shadow-lg p-4 md:p-6">
            <Calendar workoutDays={workoutDays} onDateClick={setSelectedDate} />
        </div>
      </div>

      {/* Report Section */}
      {selectedDate && selectedDateSessions.length > 0 && (
        <div id="report-section" className="mt-12 bg-gray-800 rounded-lg shadow-lg p-6 animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-blue-400">
                    Relatório de {selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </h2>
                <button onClick={() => setSelectedDate(null)} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors">
                    <XIcon />
                </button>
            </div>
            <div className="space-y-6">
                {selectedDateSessions.map(session => (
                    <div key={session.startTime} className="bg-gray-900/50 rounded-lg p-4">
                        <h3 className="text-xl font-bold text-white mb-4">{session.name}</h3>
                        <p className="text-sm text-gray-400 mb-4">
                            Duração: {formatDuration((session.endTime || session.startTime) - session.startTime)}
                        </p>
                        <ul className="space-y-4">
                            {session.exercises.map(exercise => (
                                <li key={exercise.id}>
                                    <p className="font-semibold text-lg text-gray-200">{exercise.name}</p>
                                    {exercise.isCardio ? (
                                        <div className="mt-2">
                                            {exercise.logs.map(log => log.completed ? (
                                                <p key={log.id} className="text-green-300">
                                                    Tempo: <span className="font-mono">{formatDuration(log.reps * 1000)}</span>
                                                </p>
                                            ) : (
                                                <p key={log.id} className="text-gray-500">Não concluído</p>
                                            ))}
                                        </div>
                                    ) : (
                                      <div className="overflow-x-auto mt-2">
                                          <table className="w-full text-left text-sm">
                                              <thead className="text-gray-400">
                                                  <tr>
                                                      <th className="p-2 font-semibold">Série</th>
                                                      <th className="p-2 font-semibold">Peso (kg)</th>
                                                      <th className="p-2 font-semibold">Reps</th>
                                                  </tr>
                                              </thead>
                                              <tbody>
                                                  {exercise.logs.map((log, index) => (
                                                      <tr key={log.id} className={`border-t border-gray-700 ${log.completed ? 'text-green-300' : 'text-gray-400'}`}>
                                                          <td className="p-2 font-mono">{index + 1}</td>
                                                          <td className="p-2 font-mono">{log.weight}</td>
                                                          <td className="p-2 font-mono">{log.reps}</td>
                                                      </tr>
                                                  ))}
                                              </tbody>
                                          </table>
                                      </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Atividade Recente</h2>
        <div className="bg-gray-800 rounded-lg shadow-lg p-4">
          <ul className="divide-y divide-gray-700">
            {history.slice().reverse().slice(0, 10).map(session => (
              <li key={session.startTime} className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-blue-400">{session.name}</p>
                  <p className="text-sm text-gray-400">{new Date(session.startTime).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatDuration( (session.endTime || session.startTime) - session.startTime)}</p>
                  <p className="text-sm text-gray-400">{session.exercises.length} exercícios</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      {/* Danger Zone */}
      <div className="mt-16 border-t border-gray-700 pt-8 text-center">
        <h3 className="text-xl font-semibold text-red-400">Zona de Perigo</h3>
        <p className="text-gray-400 mt-2 mb-4 max-w-md mx-auto">
            A ação abaixo é permanente e não pode ser desfeita.
        </p>
        <button
            onClick={onReset}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-5 rounded-lg transition duration-300 flex items-center gap-2 mx-auto"
        >
            <TrashIcon />
            Zerar Todos os Dados
        </button>
    </div>
    </div>
  );
};

export default Dashboard;