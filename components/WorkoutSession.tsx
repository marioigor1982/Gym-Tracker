import React, { useState, useEffect, useMemo } from 'react';
import type { WorkoutSession, ExerciseSession } from '../types';
import Timer from './Timer';
import { DumbbellIcon, PencilIcon, TrashIcon, ChevronDownIcon, MenuIcon, ArrowLeftIcon, ArrowRightIcon } from './icons';

interface WorkoutSessionProps {
  session: WorkoutSession;
  setSession: (session: WorkoutSession) => void;
  onFinish: (session: WorkoutSession) => void;
  onBack: () => void;
}

const REST_PERIOD_SECONDS = 90;

const WorkoutSessionComponent: React.FC<WorkoutSessionProps> = ({ session, setSession, onFinish, onBack }) => {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [isUpcomingListOpen, setIsUpcomingListOpen] = useState(false);
  
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<{ sets: string; reps: string }>({ sets: '3', reps: '10' });

  const [cardioTime, setCardioTime] = useState(0);
  const [isCardioTimerRunning, setIsCardioTimerRunning] = useState(false);
  const [isTransitioningNext, setIsTransitioningNext] = useState(false);
  
  useEffect(() => {
    let interval: number | undefined;
    if (isCardioTimerRunning) {
      interval = window.setInterval(() => {
        setCardioTime(prevTime => prevTime + 1);
      }, 1000);
    }
    return () => {
      if (interval) {
        window.clearInterval(interval);
      }
    };
  }, [isCardioTimerRunning]);

  useEffect(() => {
    setIsCardioTimerRunning(false);
    setCardioTime(0);
  }, [currentExerciseIndex]);


  const currentExercise = useMemo(() => {
    return session?.exercises[currentExerciseIndex];
  }, [session, currentExerciseIndex]);
  
  if (!session || !currentExercise) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Carregando treino...</p>
      </div>
    );
  }

  const formatStopwatchTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleLogChange = (exerciseId: string, setIndex: number, field: 'weight' | 'reps', value: number) => {
    const newExercises = session.exercises.map(ex => {
      if (ex.id === exerciseId) {
        // Create a mutable copy of the logs
        const newLogs = ex.logs.map(log => ({ ...log }));

        // Update the log for the current set
        (newLogs[setIndex] as any)[field] = value;

        // Propagate the change to subsequent, incomplete sets
        for (let i = setIndex + 1; i < newLogs.length; i++) {
          if (!newLogs[i].completed) {
            (newLogs[i] as any)[field] = value;
          }
        }
        
        return { ...ex, logs: newLogs };
      }
      return ex;
    });
    setSession({ ...session, exercises: newExercises });
  };

  const handleCompleteSet = (exerciseId: string, setIndex: number) => {
    const newExercises = session.exercises.map(ex => {
      if (ex.id === exerciseId) {
        const newLogs = [...ex.logs];
        newLogs[setIndex].completed = true;
        return { ...ex, logs: newLogs };
      }
      return ex;
    });

    const updatedExercise = newExercises.find(ex => ex.id === exerciseId);
    const allSetsCompleted = updatedExercise?.logs.every(log => log.completed) ?? false;

    setSession({ ...session, exercises: newExercises });

    if (allSetsCompleted) {
      if (currentExerciseIndex < newExercises.length - 1) {
        setIsResting(false); // Stop any rest timers
        setIsTransitioningNext(true);
        setTimeout(() => {
          setCurrentExerciseIndex(prev => prev + 1);
          setIsTransitioningNext(false);
        }, 2000);
      }
    } else {
      setIsResting(true);
    }
  };
  
  const handleCompleteCardioSet = (exerciseId: string, setIndex: number) => {
    setIsCardioTimerRunning(false);
    const newExercises = session.exercises.map(ex => {
      if (ex.id === exerciseId) {
        const newLogs = [...ex.logs];
        newLogs[setIndex] = {
          ...newLogs[setIndex],
          completed: true,
          reps: cardioTime, // Store elapsed seconds
        };
        return { ...ex, logs: newLogs };
      }
      return ex;
    });
    setSession({ ...session, exercises: newExercises });

    if (currentExerciseIndex < newExercises.length - 1) {
      setIsTransitioningNext(true);
      setTimeout(() => {
        setCurrentExerciseIndex(prev => prev + 1);
        setIsTransitioningNext(false);
      }, 2000);
    }
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < session.exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
    }
  };

  const handlePreviousExercise = () => {
      if (currentExerciseIndex > 0) {
          setCurrentExerciseIndex(prev => prev - 1);
      }
  };

  // --- Funções de gerenciamento de sessão ---

  const handleDeleteExercise = (exerciseId: string) => {
    if (window.confirm('Tem certeza que deseja remover este exercício da sessão? Esta ação não altera o treino salvo.')) {
        const updatedExercises = session.exercises.filter(ex => ex.id !== exerciseId);
        if (session.exercises.findIndex(e => e.id === exerciseId) < currentExerciseIndex) {
            setCurrentExerciseIndex(Math.max(0, currentExerciseIndex - 1));
        }
        setSession({ ...session, exercises: updatedExercises });
    }
  };

  const handleEditClick = (exercise: ExerciseSession) => {
      setEditingExerciseId(exercise.id);
      setEditFormData({ sets: String(exercise.sets), reps: exercise.reps });
  };

  const handleSaveEdit = (exerciseId: string) => {
    const newExercises = [...session.exercises];
    const exerciseIndex = newExercises.findIndex(ex => ex.id === exerciseId);
    if (exerciseIndex > -1) {
        const exercise = newExercises[exerciseIndex];
        const newSets = parseInt(editFormData.sets, 10) || exercise.sets;
        const newReps = editFormData.reps || exercise.reps;
        const currentLogCount = exercise.logs.length;
        let newLogs = [...exercise.logs];

        if (newSets > currentLogCount) {
            for (let i = 0; i < newSets - currentLogCount; i++) {
                newLogs.push({ id: `set-${exercise.id}-${currentLogCount + i}`, weight: 0, reps: 0, completed: false });
            }
        } else if (newSets < currentLogCount) {
            newLogs = newLogs.slice(0, newSets);
        }

        newExercises[exerciseIndex] = { ...exercise, sets: newSets, reps: newReps, logs: newLogs };
    }
    setSession({ ...session, exercises: newExercises });
    setEditingExerciseId(null);
  };
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  const handleDrop = (targetIndex: number) => {
    if (draggedItemIndex === null || draggedItemIndex === targetIndex) {
      setDraggedItemIndex(null);
      return;
    }
  
    const originalDraggedIndex = currentExerciseIndex + 1 + draggedItemIndex;
    const originalTargetIndex = currentExerciseIndex + 1 + targetIndex;
  
    const reorderedExercises = [...session.exercises];
    const [removed] = reorderedExercises.splice(originalDraggedIndex, 1);
    reorderedExercises.splice(originalTargetIndex, 0, removed);
    setSession({ ...session, exercises: reorderedExercises });
  
    setDraggedItemIndex(null);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-32">
      {isTransitioningNext && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col justify-center items-center z-[100] animate-fade-in-up">
          <DumbbellIcon className="h-16 w-16 text-blue-400 animate-bounce" />
          <p className="text-2xl font-bold mt-4">Bom trabalho!</p>
          <p className="text-lg text-gray-300">Preparando próximo exercício...</p>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
          Salvar e Voltar
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-blue-400 text-center flex-grow px-4 truncate">{session.name}</h1>
        <button onClick={() => onFinish(session)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
          Concluir
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 shadow-xl mb-6">
        {currentExercise.imageUrl && (
            <div className="mb-6 rounded-lg overflow-hidden h-48 md:h-64 bg-gray-700 flex items-center justify-center">
                <img src={currentExercise.imageUrl} alt={currentExercise.name} className="w-full h-full object-contain" />
            </div>
        )}
        <div className="flex items-center mb-4">
            <DumbbellIcon className="h-6 w-6 text-blue-400" />
            <h2 className="text-2xl font-semibold ml-3">{currentExercise.name}</h2>
        </div>

        {currentExercise.isCardio ? (
          <>
            <p className="text-gray-400 mb-4 text-center">{`Objetivo: ${currentExercise.reps}`}</p>
            <div className="space-y-4">
              {currentExercise.logs.map((log, index) => (
                <div key={log.id} className={`p-6 rounded-lg transition-colors duration-500 ${log.completed ? 'bg-green-900/50' : 'bg-gray-700'}`}>
                    {log.completed ? (
                        <div className="text-center">
                            <p className="text-gray-300">Tempo Registrado</p>
                            <p className="text-4xl font-mono my-2 text-green-400">{formatStopwatchTime(log.reps)}</p>
                            <span className="font-bold text-green-400">Completo ✓</span>
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="text-6xl font-mono tracking-widest my-4">{formatStopwatchTime(cardioTime)}</p>
                            <div className="flex justify-center items-center gap-4 mt-4">
                                <button
                                    onClick={() => setIsCardioTimerRunning(!isCardioTimerRunning)}
                                    className={`font-bold py-3 px-8 rounded-lg transition duration-300 text-white ${isCardioTimerRunning ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                                >
                                    {isCardioTimerRunning ? 'Pausar' : 'Iniciar'}
                                </button>
                                <button
                                    onClick={() => handleCompleteCardioSet(currentExercise.id, index)}
                                    disabled={!isCardioTimerRunning && cardioTime === 0}
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Concluir
                                </button>
                            </div>
                        </div>
                    )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="text-gray-400 mb-4">{`Objetivo: ${currentExercise.sets} séries de ${currentExercise.reps} reps`}</p>
            <div className="space-y-4">
              {currentExercise.logs.map((log, index) => (
                <div key={log.id} className={`p-4 rounded-lg flex flex-col md:flex-row items-center gap-4 transition-colors duration-500 ${log.completed ? 'bg-green-900/50' : 'bg-gray-700'}`}>
                  <div className="font-bold text-lg text-blue-400 w-full md:w-1/12 text-center">SÉRIE {index + 1}</div>
                  <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Peso (kg)</label>
                    <input
                      type="number"
                      disabled={log.completed}
                      value={log.weight || ''}
                      onChange={(e) => handleLogChange(currentExercise.id, index, 'weight', parseFloat(e.target.value) || 0)}
                      className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-center focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                      placeholder="0"
                    />
                  </div>
                  <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Reps</label>
                    <input
                      type="number"
                      disabled={log.completed}
                      value={log.reps || ''}
                      onChange={(e) => handleLogChange(currentExercise.id, index, 'reps', parseInt(e.target.value) || 0)}
                      className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-center focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                      placeholder="0"
                    />
                  </div>
                  <div className="w-full md:w-auto mt-2 md:mt-0 self-end">
                    {!log.completed ? (
                      <button
                        onClick={() => handleCompleteSet(currentExercise.id, index)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
                      >
                        Feito
                      </button>
                    ) : (
                      <div className="w-full text-center text-green-400 font-bold py-2 px-6">Completo ✓</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        
        <div className="mt-8 pt-4 border-t border-gray-700 flex justify-between items-center">
            <button
                onClick={handlePreviousExercise}
                disabled={currentExerciseIndex === 0}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <ArrowLeftIcon />
                Anterior
            </button>
            <span className="font-semibold text-lg text-gray-300">
                {currentExerciseIndex + 1} / {session.exercises.length}
            </span>
            <button
                onClick={handleNextExercise}
                disabled={currentExerciseIndex === session.exercises.length - 1}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Próximo
                <ArrowRightIcon />
            </button>
        </div>
      </div>

      {session.exercises.length > currentExerciseIndex + 1 && (
        <div className="mt-8">
            <button onClick={() => setIsUpcomingListOpen(!isUpcomingListOpen)} className="w-full bg-gray-700/50 hover:bg-gray-700 p-3 rounded-lg flex justify-between items-center font-semibold transition-colors">
                <span>Próximos Exercícios</span>
                <ChevronDownIcon className={`transform transition-transform ${isUpcomingListOpen ? 'rotate-180' : ''}`} />
            </button>
            {isUpcomingListOpen && (
                <div className="mt-4 space-y-3">
                    {session.exercises.slice(currentExerciseIndex + 1).map((ex, index) => {
                        const isEditing = editingExerciseId === ex.id;
                        return (
                          <div 
                            key={ex.id}
                            draggable={!isEditing}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={handleDragOver}
                            onDrop={() => handleDrop(index)}
                            onDragEnd={() => setDraggedItemIndex(null)}
                            className={`bg-gray-700 p-3 rounded-lg transition-all duration-300 ${draggedItemIndex === index ? 'opacity-50 scale-105' : 'opacity-100'}`}
                          >
                            {isEditing ? (
                              <div className="flex flex-col gap-3">
                                  <p className="font-semibold text-blue-400">{ex.name}</p>
                                  <div className="flex gap-3">
                                    <input type="number" value={editFormData.sets} onChange={e => setEditFormData({...editFormData, sets: e.target.value})} className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-center" />
                                    <input type="text" value={editFormData.reps} onChange={e => setEditFormData({...editFormData, reps: e.target.value})} className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-center" />
                                  </div>
                                  <button onClick={() => handleSaveEdit(ex.id)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-lg text-sm self-end">Salvar</button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-3 flex-grow">
                                    <div className="cursor-move" title="Arraste para reordenar">
                                      <MenuIcon className="text-gray-500" />
                                    </div>
                                    <span className="font-semibold">{ex.name}</span>
                                    <span className="text-sm text-gray-400">{ex.isCardio ? ex.reps : `${ex.sets}x${ex.reps}`}</span>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                      {!ex.isCardio && (
                                        <button onClick={() => handleEditClick(ex)} className="text-gray-400 hover:text-white p-2 rounded-full bg-gray-600/50 hover:bg-gray-600 transition duration-300">
                                            <PencilIcon />
                                        </button>
                                      )}
                                      <button onClick={() => handleDeleteExercise(ex.id)} className="text-gray-400 hover:text-white p-2 rounded-full bg-gray-600/50 hover:bg-gray-600 transition duration-300">
                                        <TrashIcon />
                                      </button>
                                  </div>
                              </div>
                            )}
                          </div>
                        )
                    })}
                </div>
            )}
        </div>
      )}

      <Timer 
        initialSeconds={REST_PERIOD_SECONDS}
        isRunning={isResting}
        onComplete={() => setIsResting(false)}
      />
    </div>
  );
};

export default WorkoutSessionComponent;