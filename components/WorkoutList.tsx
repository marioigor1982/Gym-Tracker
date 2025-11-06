import React, { useState } from 'react';
import type { Workout } from '../types';
import { PencilIcon, PlayIcon, TrashIcon, DumbbellIcon } from './icons';

interface WorkoutListProps {
  workouts: Workout[];
  onStartWorkout: (workout: Workout) => void;
  onContinueWorkout: () => void;
  onEditWorkout: (workout: Workout) => void;
  onDeleteWorkout: (id: string) => void;
  completedTodayIds: Set<string>;
  inProgressWorkoutId: string | null;
}

const WorkoutList: React.FC<WorkoutListProps> = ({ workouts, onStartWorkout, onContinueWorkout, onEditWorkout, onDeleteWorkout, completedTodayIds, inProgressWorkoutId }) => {
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    onDeleteWorkout(id);
    setConfirmingDeleteId(null);
  };

  const handleCancelDelete = () => {
    setConfirmingDeleteId(null);
  };


  return (
    <>
      <div className="p-4 md:p-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Seus Treinos</h1>
          <p className="text-lg text-gray-400">Pronto para esmagar seus objetivos?</p>
        </div>
        
        {workouts.length === 0 ? (
          <div className="text-center bg-gray-800 p-10 rounded-lg max-w-md mx-auto">
            <DumbbellIcon className="h-12 w-12 text-blue-500 mx-auto" />
            <h2 className="mt-4 text-2xl font-semibold">Nenhum treino encontrado</h2>
            <p className="mt-2 text-gray-400">Crie seu primeiro treino para começar!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workouts.map(workout => {
              const isCompletedToday = completedTodayIds.has(workout.id);
              const isInProgress = workout.id === inProgressWorkoutId;
              let imageUrl = null;
              const workoutNameLower = workout.name.toLowerCase();

              if (workoutNameLower.includes('costas')) {
                imageUrl = 'https://i.postimg.cc/x8sfS1M0/Costas-Biceps.webp';
              } else if (workoutNameLower.includes('peito')) {
                imageUrl = 'https://i.postimg.cc/2yHkfShS/Peito-Triceps.png';
              } else if (workoutNameLower.includes('perna')) {
                imageUrl = 'https://i.postimg.cc/fyHzhRmT/Perna.png';
              } else if (workoutNameLower.includes('cardio')) {
                imageUrl = 'https://i.postimg.cc/g001fH4v/Cardio.png';
              }


              const exerciseContent = (
                <ul className="text-gray-300 space-y-1 mb-6">
                  {workout.exercises.slice(0, 4).map(ex => (
                    <li key={ex.id} className="truncate">{`${ex.name} (${ex.isCardio ? ex.reps : `${ex.sets}x${ex.reps}`})`}</li>
                  ))}
                  {workout.exercises.length > 4 && <li className="text-gray-500">...e mais</li>}
                </ul>
              );
              
              let actionButton;
              if (isInProgress) {
                  actionButton = (
                      <button
                          onClick={onContinueWorkout}
                          className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-5 rounded-lg flex items-center gap-2 transition duration-300"
                      >
                          <PlayIcon /> Continuar
                      </button>
                  );
              } else if (isCompletedToday) {
                  actionButton = (
                      <button
                          disabled
                          className="bg-green-800 text-white font-bold py-2 px-5 rounded-lg flex items-center gap-2 cursor-not-allowed"
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Concluído
                      </button>
                  );
              } else {
                  actionButton = (
                      <button
                          onClick={() => onStartWorkout(workout)}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-5 rounded-lg flex items-center gap-2 transition duration-300"
                      >
                          <PlayIcon /> Iniciar
                      </button>
                  );
              }

              const actionButtons = (
                <div className="flex justify-between items-center mt-4">
                  {actionButton}
                  <div className="flex gap-2 items-center">
                    {confirmingDeleteId === workout.id ? (
                      <>
                        <button onClick={() => handleDeleteClick(workout.id)} className="text-white bg-red-600 hover:bg-red-700 font-bold py-2 px-3 rounded-lg text-sm transition duration-300 animate-fade-in-up">
                          Apagar
                        </button>
                        <button onClick={handleCancelDelete} className="text-gray-300 bg-gray-600 hover:bg-gray-500 font-bold py-2 px-3 rounded-lg text-sm transition duration-300">
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => onEditWorkout(workout)} className="text-gray-400 hover:text-white p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition duration-300">
                          <PencilIcon />
                        </button>
                        <button onClick={() => setConfirmingDeleteId(workout.id)} className="text-gray-400 hover:text-white p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition duration-300">
                          <TrashIcon />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );

              return (
                <div 
                  key={workout.id} 
                  className={`bg-gray-800 rounded-lg shadow-lg flex flex-col border-2 transition-all duration-300 overflow-hidden transform hover:scale-105 ${
                    isCompletedToday 
                      ? 'border-green-800/50 opacity-60' 
                      : isInProgress
                      ? 'border-yellow-500 shadow-yellow-500/20'
                      : 'border-gray-700 hover:shadow-blue-500/20 hover:border-blue-500'
                  }`}
                >
                  {imageUrl ? (
                    <>
                      <div className="relative h-40">
                        <img src={imageUrl} alt={workout.name} className={`w-full h-full object-cover transition-all duration-300 ${isCompletedToday ? 'filter grayscale' : ''}`} />
                        <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent ${isCompletedToday ? 'bg-black/30' : ''}`}></div>
                        <div className="absolute bottom-4 left-6 z-10">
                          <h3 className="text-2xl font-bold text-white">{workout.name}</h3>
                        </div>
                        {isInProgress && (
                          <div className="absolute top-3 right-3 z-10 bg-yellow-400 text-black font-bold text-xs py-1 px-3 rounded-full uppercase">
                              Em Andamento
                          </div>
                        )}
                      </div>
                      <div className="p-6 flex-grow flex flex-col justify-between">
                        {exerciseContent}
                        {actionButtons}
                      </div>
                    </>
                  ) : (
                    <div className="p-6 flex-grow flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-xl font-bold text-blue-400">{workout.name}</h3>
                          {isInProgress && (
                              <span className="bg-yellow-400 text-black font-bold text-xs py-1 px-2 rounded-full uppercase">
                                  Em Andamento
                              </span>
                          )}
                        </div>
                        {exerciseContent}
                      </div>
                      {actionButtons}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default WorkoutList;