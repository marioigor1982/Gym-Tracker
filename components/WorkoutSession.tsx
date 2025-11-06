import React, { useState, useEffect, useMemo } from 'react';
import type { WorkoutSession, ExerciseSession } from '../types';
import Timer from './Timer';
import { DumbbellIcon, PencilIcon, TrashIcon, ChevronDownIcon, MenuIcon, ArrowLeftIcon, ArrowRightIcon } from './icons';
import InteractiveNumberInput from './InteractiveNumberInput';
import ConfirmModal from './ConfirmModal';

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
  const [exerciseToDeleteId, setExerciseToDeleteId] = useState<string | null>(null);

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
  
  const exerciseToDelete = session.exercises.find(e => e.id === exerciseToDeleteId);

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
            const newLogs = ex.logs.map((log, i) => {
                if (i === setIndex) {
                    return { ...log, completed: true };
                }
                return log;
            });
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
            const newLogs = ex.logs.map((log, i) => {
                if (i === setIndex) {
                    return {
                        ...log,
                        completed: true,
                        reps: cardioTime, // Store elapsed seconds
                    };
                }
                return log;
            });
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
    const exerciseIndexToDelete = session.exercises.findIndex(ex => ex.id === exerciseId);
    if (exerciseIndexToDelete === -1) return;

    const updatedExercises = session.exercises.filter(ex => ex.id !== exerciseId);

    if (updatedExercises.length === 0) {
        alert("Você removeu o último exercício. A sessão será salva e você voltará para a lista de treinos.");
        onBack();
        return;
    }

    let newCurrentExerciseIndex = currentExerciseIndex;

    if (exerciseIndexToDelete < currentExerciseIndex) {
        // If we deleted an exercise before the current one, shift index back.
        newCurrentExerciseIndex = currentExerciseIndex - 1;
    } else if (exerciseIndexToDelete === currentExerciseIndex) {
        // If we deleted the current exercise, the index stays the same,
        // but we must ensure it's not out of bounds of the new, shorter array.
        if (newCurrentExerciseIndex >= updatedExercises.length) {
            newCurrentExerciseIndex = updatedExercises.length - 1;
        }
    }
    
    setCurrentExerciseIndex(Math.max(0, newCurrentExerciseIndex));
    setSession({ ...session, exercises: updatedExercises });
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
        <button onClick={onBack} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
          Salvar e Voltar
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-blue-400 text-center flex-grow px-4 truncate">{session.name}</h1>
        <button onClick={() => onFinish(session)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
          Concluir
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 shadow-xl mb-6 border border-gray-700">
        {currentExercise.imageUrl && (
            <div className="mb-6 rounded-lg overflow-hidden h-48 md:h-64 bg-gray-900/50 flex items-center justify-center">
                <img src={currentExercise.imageUrl} alt={currentExercise.name} className="w-full h-full object-contain" />
            </div>
        )}
        <div className="flex items-center mb-4">
            <h2 className="text-3xl font-bold">{currentExercise.name}</h2>
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
                <div key={log.id} className={`p-4 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4 transition-colors duration-500 ${log.completed ? 'bg-green-900/50' : 'bg-gray-700'}`}>
                  <div className="font-bold text-lg text-blue-400 w-full md:w-auto text-center mb-4 md:mb-0">SÉRIE {index + 1}</div>
                  <div className="flex-grow flex items-start justify-center gap-4 md:gap-8 w-full">
                      <div className="flex-1 flex flex-col items-center gap-2">
                          <label className="block text-sm font-medium text-gray-300">Peso (kg)</label>
                          <InteractiveNumberInput
                              value={log.weight}
                              onChange={(newValue) => handleLogChange(currentExercise.id, index, 'weight', newValue)}
                              step={2.5}
                              min={0}
                              disabled={log.completed}
                          />
                      </div>
                      <div className="flex-1 flex flex-col items-center gap-2">
                          <label className="block text-sm font-medium text-gray-300">Reps</label>
                          <InteractiveNumberInput
                              value={log.reps}
                              onChange={(newValue) => handleLogChange(currentExercise.id, index, 'reps', Math.round(newValue))}
                              step={1}
                              min={0}
                              disabled={log.completed}
                          />
                      </div>
                  </div>
                  <div className="w-full md:w-auto mt-4 md:mt-0 self-center">
                      {!log.completed ? (
                          <button
                              onClick={() => handleCompleteSet(currentExercise.id, index)}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300"
                          >
                              Feito
                          </button>
                      ) : (
                          <div className="w-full text-center text-green-400 font-bold py-3 px-8">Completo ✓</div>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="mt-8 pt-4 flex justify-between items-center">
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

      {session.exercises.length > currentExerciseIndex + 1 && (
        <div className="mt-8">
            <button onClick={() => setIsUpcomingListOpen(!isUpcomingListOpen)} className="w-full bg-gray-800 border border-gray-700 hover:bg-gray-700/50 p-3 rounded-lg flex justify-between items-center font-semibold transition-colors">
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
                                      <button onClick={() => setExerciseToDeleteId(ex.id)} className="text-gray-400 hover:text-white p-2 rounded-full bg-gray-600/50 hover:bg-gray-600 transition duration-300">
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
      {exerciseToDelete && (
        <ConfirmModal
          isOpen={!!exerciseToDelete}
          onClose={() => setExerciseToDeleteId(null)}
          onConfirm={() => {
            handleDeleteExercise(exerciseToDelete.id);
            setExerciseToDeleteId(null);
          }}
          title="Remover Exercício?"
          message={`Tem certeza que deseja remover "${exerciseToDelete.name}" da sua sessão atual? Esta ação não altera o treino salvo.`}
          confirmText="Sim, Remover"
          cancelText="Cancelar"
        />
      )}
    </div>
  );
};

export default WorkoutSessionComponent;