import React, { useState, useMemo } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { Workout, WorkoutSession } from './types';
import WorkoutList from './components/WorkoutList';
import WorkoutForm from './components/WorkoutForm';
import WorkoutSessionComponent from './components/WorkoutSession';
import Dashboard from './components/Dashboard';
import { PlusIcon, DumbbellIcon, ChartBarIcon, HomeIcon } from './components/icons';
import SplashScreen from './components/SplashScreen';

type View = 'list' | 'form' | 'session' | 'dashboard';

const PREDEFINED_WORKOUT_NAMES = ['Cardio', 'Peito', 'Costas', 'Perna'];

const App: React.FC = () => {
  const [workouts, setWorkouts] = useLocalStorage<Workout[]>('workouts', []);
  const [workoutHistory, setWorkoutHistory] = useLocalStorage<WorkoutSession[]>('workoutHistory', []);
  const [currentView, setCurrentView] = useState<View>('list');
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [workoutToEdit, setWorkoutToEdit] = useState<Workout | null>(null);
  const [hasEntered, setHasEntered] = useState(false);

  const existingWorkoutNames = workouts.map(w => w.name);
  const availableWorkoutNames = PREDEFINED_WORKOUT_NAMES.filter(
    name => !existingWorkoutNames.includes(name)
  );

  const completedTodayIds = useMemo(() => {
    const todayStr = new Date().toDateString();
    const ids = new Set<string>();
    workoutHistory
        .filter(session => new Date(session.startTime).toDateString() === todayStr)
        .forEach(session => ids.add(session.workoutId));
    return ids;
  }, [workoutHistory]);

  const handleCreateNew = () => {
    if (availableWorkoutNames.length === 0) {
      alert("Todos os tipos de treino já foram criados.");
      return;
    }
    setWorkoutToEdit(null);
    setCurrentView('form');
  };

  const handleEditWorkout = (workout: Workout) => {
    setWorkoutToEdit(workout);
    setCurrentView('form');
  };

  const handleDeleteWorkout = (id: string) => {
    // A confirmação agora é tratada na UI, então a gente só deleta.
    setWorkouts(prevWorkouts => prevWorkouts.filter(w => w.id !== id));
  };

  const handleDeleteWorkoutFromForm = (id: string) => {
    if (window.confirm('Tem certeza que deseja apagar este treino? Esta ação não pode ser desfeita.')) {
      setWorkouts(prevWorkouts => prevWorkouts.filter(w => w.id !== id));
      setCurrentView('list');
    }
  };

  const handleSaveWorkout = (workout: Workout) => {
    setWorkouts(prevWorkouts => {
      const index = prevWorkouts.findIndex(w => w.id === workout.id);
      if (index > -1) {
        const newWorkouts = [...prevWorkouts];
        newWorkouts[index] = workout;
        return newWorkouts;
      }
      return [...prevWorkouts, workout];
    });
    setCurrentView('list');
  };

  const handleStartWorkout = (workout: Workout) => {
    if (workout.exercises.length === 0) {
      alert("Este treino está vazio. Adicione exercícios para poder iniciá-lo.");
      handleEditWorkout(workout);
      return;
    }
    setSelectedWorkout(workout);
    setCurrentView('session');
  };

  const handleFinishWorkout = (sessionData: WorkoutSession) => {
    const completedSession = {
        ...sessionData,
        endTime: Date.now(),
    };
    setWorkoutHistory(prevHistory => [...prevHistory, completedSession]);
    setSelectedWorkout(null);
    setCurrentView('list');
  };
  
  const handleCloseForm = () => {
    setCurrentView('list');
  }

  const handleResetApp = () => {
    if (window.confirm('Você tem certeza que deseja apagar TODOS os dados do aplicativo? Seus treinos e histórico de progresso serão perdidos permanentemente.')) {
      // Clear localStorage
      window.localStorage.removeItem('workouts');
      window.localStorage.removeItem('workoutHistory');
      
      // Force a page reload to ensure the app starts with a clean state
      window.location.reload();
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'session':
        return selectedWorkout ? (
          <WorkoutSessionComponent workout={selectedWorkout} onFinish={handleFinishWorkout} />
        ) : null;
      case 'form':
        return (
          <WorkoutForm 
            workoutToEdit={workoutToEdit} 
            onSave={handleSaveWorkout} 
            onClose={handleCloseForm}
            onDelete={handleDeleteWorkoutFromForm}
            availableWorkoutNames={availableWorkoutNames}
          />
        );
      case 'dashboard':
        return <Dashboard history={workoutHistory} onReset={handleResetApp} />;
      case 'list':
      default:
        return (
          <WorkoutList
            workouts={workouts}
            onStartWorkout={handleStartWorkout}
            onEditWorkout={handleEditWorkout}
            onDeleteWorkout={handleDeleteWorkout}
            completedTodayIds={completedTodayIds}
          />
        );
    }
  };

  if (!hasEntered) {
    return <SplashScreen onEnter={() => setHasEntered(true)} />;
  }

  const isNewWorkoutDisabled = availableWorkoutNames.length === 0;

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <header className="bg-gray-800/80 backdrop-blur-sm shadow-lg sticky top-0 z-40">
        <nav className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
          <button onClick={() => setCurrentView('list')} className="flex items-center gap-3 cursor-pointer">
            <DumbbellIcon />
            <span className="text-2xl font-bold tracking-tight">Gym Tracker</span>
          </button>
          <div className="flex items-center gap-2">
            {currentView === 'list' && (
              <>
                <button onClick={() => setHasEntered(false)} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition duration-300">
                  <HomeIcon className="h-5 w-5 text-blue-400" />
                  <span className="hidden sm:inline">Início</span>
                </button>
                <button onClick={() => setCurrentView('dashboard')} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition duration-300">
                  <ChartBarIcon className="h-5 w-5 text-blue-400" />
                  <span className="hidden sm:inline">Progresso</span>
                </button>
                <button 
                  onClick={handleCreateNew} 
                  disabled={isNewWorkoutDisabled}
                  title={isNewWorkoutDisabled ? "Todos os tipos de treino já foram criados" : "Criar um novo treino"}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlusIcon />
                  <span className="hidden sm:inline">Novo Treino</span>
                </button>
              </>
            )}
            {currentView === 'dashboard' && (
              <button onClick={() => setCurrentView('list')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition duration-300">
                <DumbbellIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Meus Treinos</span>
              </button>
            )}
          </div>
        </nav>
      </header>
      <main className="container mx-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;