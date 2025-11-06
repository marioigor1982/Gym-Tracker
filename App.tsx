import React, { useState, useMemo } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { Workout, WorkoutSession, Exercise, ExerciseSession, SetLog } from './types';
import WorkoutList from './components/WorkoutList';
import WorkoutForm from './components/WorkoutForm';
import WorkoutSessionComponent from './components/WorkoutSession';
import Dashboard from './components/Dashboard';
import SplashScreen from './components/SplashScreen';
import { PlusIcon, DumbbellIcon, ChartBarIcon, HomeIcon } from './components/icons';

type View = 'list' | 'form' | 'session' | 'dashboard';

const PREDEFINED_WORKOUT_NAMES = ['Cardio', 'Peito', 'Costas', 'Perna'];

const App: React.FC = () => {
  const [workouts, setWorkouts] = useLocalStorage<Workout[]>('workouts', []);
  const [workoutHistory, setWorkoutHistory] = useLocalStorage<WorkoutSession[]>('workoutHistory', []);
  const [activeSession, setActiveSession] = useLocalStorage<WorkoutSession | null>('activeWorkoutSession', null);
  const [showSplash, setShowSplash] = useState(true);
  
  const [currentView, setCurrentView] = useState<View>(() => {
    try {
      const storedSession = window.localStorage.getItem('activeWorkoutSession');
      return storedSession && storedSession !== 'null' ? 'session' : 'list';
    } catch {
      return 'list';
    }
  });

  const [workoutToEdit, setWorkoutToEdit] = useState<Workout | null>(null);

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
    if (activeSession) {
      if (!window.confirm('Já existe um treino em andamento. Deseja iniciar um novo e abandonar o atual?')) {
        return;
      }
    }
    if (workout.exercises.length === 0) {
      alert("Este treino está vazio. Adicione exercícios para poder iniciá-lo.");
      handleEditWorkout(workout);
      return;
    }
    const newSession: WorkoutSession = {
        workoutId: workout.id,
        name: workout.name,
        startTime: Date.now(),
        exercises: workout.exercises.map((ex: Exercise): ExerciseSession => ({
            ...ex,
            logs: Array.from({ length: ex.isCardio ? 1 : ex.sets }, (_, i): SetLog => ({
                id: `set-${ex.id}-${i}`,
                weight: 0,
                reps: 0,
                completed: false,
            })),
        })),
    };
    setActiveSession(newSession);
    setCurrentView('session');
  };

  const handleContinueWorkout = () => {
    setCurrentView('session');
  };

  const handleFinishWorkout = (sessionData: WorkoutSession) => {
    const completedSession = {
        ...sessionData,
        endTime: Date.now(),
    };
    setWorkoutHistory(prevHistory => [...prevHistory, completedSession]);
    setActiveSession(null);
    setCurrentView('list');
  };

  const handleAbandonWorkout = () => {
    if (window.confirm('Tem certeza que deseja abandonar o treino? Seu progresso nesta sessão será perdido.')) {
        setActiveSession(null);
        setCurrentView('list');
    }
  }
  
  const handleCloseForm = () => {
    setCurrentView('list');
  }
  
  const handleGoBackToList = () => {
    setCurrentView('list');
  };

  const handleGoHome = () => {
    setShowSplash(true);
  };

  const handleResetApp = () => {
    window.localStorage.clear();
    window.location.reload();
  };

  const renderContent = () => {
    switch (currentView) {
      case 'session':
        return activeSession ? (
          <WorkoutSessionComponent 
            session={activeSession}
            setSession={setActiveSession} 
            onFinish={handleFinishWorkout}
            onBack={handleGoBackToList}
          />
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
            onContinueWorkout={handleContinueWorkout}
            onEditWorkout={handleEditWorkout}
            onDeleteWorkout={handleDeleteWorkout}
            completedTodayIds={completedTodayIds}
            inProgressWorkoutId={activeSession?.workoutId || null}
          />
        );
    }
  };

  if (showSplash) {
    return <SplashScreen onEnter={() => setShowSplash(false)} />;
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
            {['list', 'dashboard'].includes(currentView) && (
              <button onClick={handleGoHome} title="Tela Inicial" className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition duration-300">
                  <HomeIcon className="h-5 w-5" />
                  <span className="hidden sm:inline">Início</span>
              </button>
            )}

            {currentView === 'list' && (
              <>
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
            {currentView === 'session' && activeSession && (
                <button onClick={handleAbandonWorkout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition duration-300">
                    Abandonar
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