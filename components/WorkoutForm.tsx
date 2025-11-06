import React, { useState, useEffect } from 'react';
import type { Workout, Exercise } from '../types';
import { PlusIcon, TrashIcon, XIcon, DumbbellIcon } from './icons';
import { predefinedExercises, PredefinedExercise } from '../data';

interface WorkoutFormProps {
  workoutToEdit?: Workout | null;
  onSave: (workout: Workout) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
  availableWorkoutNames?: string[];
}

const WorkoutForm: React.FC<WorkoutFormProps> = ({ workoutToEdit, onSave, onClose, onDelete, availableWorkoutNames }) => {
  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [focusedInputIndex, setFocusedInputIndex] = useState<number | null>(null);

  useEffect(() => {
    if (workoutToEdit) {
      setName(workoutToEdit.name);
      setExercises(workoutToEdit.exercises);
    } else {
      setName(availableWorkoutNames?.[0] || '');
      setExercises([{ id: crypto.randomUUID(), name: '', sets: 3, reps: '10', imageUrl: undefined, isCardio: false }]);
    }
  }, [workoutToEdit, availableWorkoutNames]);
  
  const handleExerciseChange = (index: number, field: keyof Omit<Exercise, 'id'>, value: string | number) => {
    const newExercises = [...exercises];
    if (field === 'sets' && typeof value === 'string') {
        newExercises[index][field] = parseInt(value, 10) || 0;
    } else {
        (newExercises[index] as any)[field] = value;
    }
    setExercises(newExercises);
  };

  const handleSuggestionSelect = (index: number, suggestion: PredefinedExercise) => {
    const newExercises = [...exercises];
    const isCardio = suggestion.category === 'Cardio';
    newExercises[index] = { 
        ...newExercises[index],
        name: suggestion.name,
        imageUrl: suggestion.imageUrl,
        isCardio,
        sets: isCardio ? 1 : 3,
        reps: isCardio ? '20 min' : '10',
    };
    setExercises(newExercises);
    setFocusedInputIndex(null);
  };
  
  const addExercise = () => {
      setExercises([...exercises, { id: crypto.randomUUID(), name: '', sets: 3, reps: '10', imageUrl: undefined, isCardio: false }]);
  };
  
  const removeExercise = (id: string) => {
      if (exercises.length > 1) {
        setExercises(exercises.filter(ex => ex.id !== id));
      } else {
        alert("Um treino deve ter pelo menos um exercício.");
      }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim() || exercises.some(ex => !ex.name.trim())) {
          alert("Por favor, selecione um tipo de treino e preencha todos os nomes dos exercícios.");
          return;
      }
      onSave({
          id: workoutToEdit?.id || crypto.randomUUID(),
          name,
          exercises,
      });
  };

  const getSuggestions = (query: string) => {
    if (!query || query.length < 2) return [];
    return predefinedExercises
      .filter(ex => ex.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-full flex flex-col">
        <div className="p-6 flex justify-between items-center border-b border-gray-700">
            <h2 className="text-2xl font-bold text-blue-400">{workoutToEdit ? `Editar Treino: ${workoutToEdit.name}` : 'Criar Novo Treino'}</h2>
            <div className="flex items-center gap-4">
              <button type="submit" form="workout-form" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300">
                Salvar
              </button>
              <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
                <XIcon />
              </button>
            </div>
        </div>
        <form id="workout-form" onSubmit={handleSubmit} className="flex-grow overflow-y-auto">
          <div className="p-6">
            <div className="mb-6">
              <label htmlFor="workout-name" className="block text-sm font-medium text-gray-300 mb-1">Nome do Treino</label>
              {workoutToEdit ? (
                <input
                  id="workout-name"
                  type="text"
                  value={name}
                  disabled
                  className="w-full bg-gray-900 border border-gray-700 rounded-md p-3 cursor-not-allowed"
                />
              ) : (
                <select
                  id="workout-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {availableWorkoutNames?.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              )}
            </div>

            <h3 className="text-lg font-semibold mb-4 text-gray-200">Exercícios</h3>
            <div className="space-y-4">
              {exercises.map((exercise, index) => {
                const suggestions = focusedInputIndex === index ? getSuggestions(exercise.name) : [];
                return (
                  <div key={exercise.id} className="bg-gray-700 p-4 rounded-md flex flex-col sm:flex-row gap-4 items-center">
                    <div className="flex-shrink-0 w-24 h-24 bg-gray-800 rounded-md flex items-center justify-center">
                      {exercise.imageUrl ? (
                        <img src={exercise.imageUrl} alt={exercise.name} className="w-full h-full object-cover rounded-md" />
                      ) : (
                        <DumbbellIcon className="h-10 w-10 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-grow w-full flex flex-col gap-4">
                       <div className="relative w-full">
                        <label className="block text-xs font-medium text-gray-400 mb-1">Nome do Exercício</label>
                        <input
                          type="text"
                          value={exercise.name}
                          onChange={(e) => handleExerciseChange(index, 'name', e.target.value)}
                          onFocus={() => setFocusedInputIndex(index)}
                          onBlur={() => setTimeout(() => setFocusedInputIndex(null), 200)}
                          placeholder="Ex: Supino Reto"
                          className="w-full bg-gray-800 border border-gray-600 rounded-md p-2"
                          required
                          autoComplete="off"
                        />
                        {suggestions.length > 0 && (
                          <ul className="absolute z-10 w-full bg-gray-900 border border-gray-600 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
                            {suggestions.map((sugg) => (
                              <li
                                key={sugg.name + sugg.category}
                                className="p-2 hover:bg-blue-600 cursor-pointer flex items-center gap-3"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleSuggestionSelect(index, sugg);
                                }}
                              >
                                <img src={sugg.imageUrl} alt={sugg.name} className="w-12 h-12 object-cover rounded-md flex-shrink-0" />
                                <div>
                                  <span className="font-semibold">{sugg.name}</span>
                                  <span className="block text-xs text-gray-400">{sugg.category}</span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {exercise.isCardio ? (
                        <div className="flex items-end gap-4">
                          <div className="flex-grow">
                            <label className="block text-xs font-medium text-gray-400 mb-1">Tempo</label>
                            <input
                              type="text"
                              value={exercise.reps}
                              onChange={(e) => handleExerciseChange(index, 'reps', e.target.value)}
                              placeholder="20 min"
                              className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-center"
                            />
                          </div>
                           <button type="button" onClick={() => removeExercise(exercise.id)} className="text-red-500 hover:text-red-400 p-2 rounded-full bg-gray-800 disabled:opacity-50" disabled={exercises.length <= 1}>
                              <TrashIcon />
                           </button>
                        </div>
                      ) : (
                        <div className="flex items-end gap-4">
                          <div className="flex-grow">
                              <label className="block text-xs font-medium text-gray-400 mb-1">Séries</label>
                              <input
                                  type="number"
                                  value={exercise.sets}
                                  onChange={(e) => handleExerciseChange(index, 'sets', e.target.value)}
                                  className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-center"
                                  min="1"
                              />
                          </div>
                          <div className="flex-grow">
                              <label className="block text-xs font-medium text-gray-400 mb-1">Reps</label>
                              <input
                                  type="text"
                                  value={exercise.reps}
                                  onChange={(e) => handleExerciseChange(index, 'reps', e.target.value)}
                                  placeholder="8-12"
                                  className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-center"
                              />
                          </div>
                          <button type="button" onClick={() => removeExercise(exercise.id)} className="text-red-500 hover:text-red-400 p-2 rounded-full bg-gray-800 disabled:opacity-50" disabled={exercises.length <= 1}>
                            <TrashIcon />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button type="button" onClick={addExercise} className="mt-6 flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold">
              <PlusIcon />
              Adicionar Exercício
            </button>
          </div>
          
          <div className="bg-gray-900 px-6 py-4 flex justify-start items-center mt-auto border-t border-gray-700">
            {workoutToEdit && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(workoutToEdit.id)}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 flex items-center gap-2"
              >
                <TrashIcon /> Excluir
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkoutForm;
