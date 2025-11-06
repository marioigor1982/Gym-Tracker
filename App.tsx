import React, { useState, useMemo, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { Workout, WorkoutSession, Exercise, ExerciseSession, SetLog } from './types';
import WorkoutList from './components/WorkoutList';
import WorkoutForm from './components/WorkoutForm';
import WorkoutSessionComponent from './components/WorkoutSession';
import Dashboard from './components/Dashboard';
import SplashScreen from './components/SplashScreen';
import { PlusIcon, DumbbellIcon, ChartBarIcon, HomeIcon } from './components/icons';
import ConfirmModal from './components/ConfirmModal';

type View = 'list' | 'form' | 'session' | 'dashboard';

const PREDEFINED_WORKOUT_NAMES = ['Cardio', 'Peito', 'Costas', 'Perna'];

const App: React.FC = () => {
  const [workouts, setWorkouts] = useLocalStorage<Workout[]>('workouts', []);
  const [workoutHistory, setWorkoutHistory] = useLocalStorage<WorkoutSession[]>('workoutHistory', []);
  const [activeSession, setActiveSession] = useLocalStorage<WorkoutSession | null>('activeWorkoutSession', null);
  const [showSplash, setShowSplash] = useState(true);
  const [isAbandonConfirmOpen, setIsAbandonConfirmOpen] = useState(false);
  const [isStartNewConfirmOpen, setIsStartNewConfirmOpen] = useState(false);
  const [workoutToStart, setWorkoutToStart] = useState<Workout | null>(null);

  const [currentView, setCurrentView] = useState<View>(() => {
    try {
      const storedSession = window.localStorage.getItem('activeWorkoutSession');
      return storedSession && storedSession !== 'null' ? 'session' : 'list';
    } catch {
      return 'list';
    }
  });

  const [workoutToEdit, setWorkoutToEdit] = useState<Workout | null>(null);

  // Wallpaper slideshow for the list view
  const wallpapers = [
    'https://images.unsplash.com/photo-1623874514711-0f321325f318?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8YWNhZGVtaWF8ZW58MHx8MHx8fDA=&fm=jpg&q=60&w=3000',
    'https://assets-cdn.wellhub.com/images/?su=https://images.partners.gympass.com/image/partners/0f3087f7-e147-40ec-af23-8a605ec1b263/lg_f795cf52-e518-4555-99f5-0cf83f9129d1_WhatsAppImage20230822at10.39.28.jpeg&h=280',
    'https://cdn.pixabay.com/photo/2016/03/27/23/00/weight-lifting-1284616_640.jpg',
    'https://media.istockphoto.com/id/2202976374/pt/foto/modern-gym-with-exercise-machines.webp?a=1&b=1&s=612x612&w=0&k=20&c=kxyJqlUN5yDOOGiWUcr491JcTVJEE3mS8y0sf2p3p9E=',
    'https://cdn.gazetasp.com.br/img/pc/825/560/dn_arquivo/2024/08/novo-projeto-3_1.jpg',
    'https://img.freepik.com/fotos-premium/close-up-dos-equipamentos-na-academia-de-treinamento_180547-3310.jpg?semt=ais_hybrid&w=740',
    'https://img.freepik.com/fotos-premium/uma-fileira-de-kettlebells-em-uma-prateleira-em-uma-decoracao-de-ginasio-moderna_784085-291.jpg?semt=ais_hybrid&w=740',
    'https://img.freepik.com/fotos-gratis/halteres-pretos-com-pesos-diferentes_7502-8973.jpg?semt=ais_hybrid&w=740',
    'https://media.istockphoto.com/id/2206518490/pt/foto/dumbbells-arranged-on-rack-in-modern-gym-showing-equipment-for-fitness-training.webp?a=1&b=1&s=612x612&w=0&k=20&c=elG8mxRZ8ulBcNdllFBlQmAklUZRm4Bv0PmNtxPoH_s='
  ];
  const [backgroundIndex, setBackgroundIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setBackgroundIndex((prevIndex) => (prevIndex + 1) % wallpapers.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

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
    setWorkouts(prevWorkouts => prevWorkouts.filter(w => w.id !== id));
    setCurrentView('list');
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
  
  const startWorkout = (workout: Workout) => {
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
            logs: Array.from({ length: ex.isCardio ? 1 : (ex.sets || 1) }, (_, i): SetLog => ({
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

  const handleStartWorkout = (workout: Workout) => {
    if (activeSession) {
      setWorkoutToStart(workout);
      setIsStartNewConfirmOpen(true);
    } else {
       startWorkout(workout);
    }
  };

  const confirmStartNewWorkout = () => {
    if (workoutToStart) {
        startWorkout(workoutToStart);
    }
    setIsStartNewConfirmOpen(false);
    setWorkoutToStart(null);
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
    setIsAbandonConfirmOpen(true);
  };
  
  const confirmAbandonWorkout = () => {
    setActiveSession(null);
    setCurrentView('list');
    setIsAbandonConfirmOpen(false);
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
    <div className="min-h-screen bg-gray-900 text-white font-sans relative">
       {currentView === 'list' && (
        <>
          {wallpapers.map((url, index) => (
            <div
              key={url}
              className={`fixed inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out z-0 ${
                index === backgroundIndex ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ backgroundImage: `url('${url}')` }}
            />
          ))}
          <div className="fixed inset-0 bg-gray-900 bg-opacity-80 z-0" />
        </>
      )}

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
      <main className="container mx-auto relative z-10">
        {renderContent()}
      </main>
      <ConfirmModal
        isOpen={isAbandonConfirmOpen}
        onClose={() => setIsAbandonConfirmOpen(false)}
        onConfirm={confirmAbandonWorkout}
        title="Abandonar Treino?"
        message="Tem certeza que deseja abandonar o treino? Seu progresso nesta sessão será perdido."
        confirmText="Sim, Abandonar"
        cancelText="Cancelar"
      />
      <ConfirmModal
        isOpen={isStartNewConfirmOpen}
        onClose={() => setIsStartNewConfirmOpen(false)}
        onConfirm={confirmStartNewWorkout}
        title="Iniciar Novo Treino?"
        message="Já existe um treino em andamento. Deseja iniciar um novo e abandonar o atual?"
        confirmText="Sim, Iniciar Novo"
        cancelText="Cancelar"
      />
    </div>
  );
};

export default App;