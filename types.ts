
export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string; // e.g., "8-12" or "10"
  imageUrl?: string;
  isCardio?: boolean;
}

export interface Workout {
  id: string;
  name: string;
  exercises: Exercise[];
}

export interface SetLog {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
}

export interface ExerciseSession extends Exercise {
  logs: SetLog[];
}

export interface WorkoutSession {
  workoutId: string;
  name: string;
  exercises: ExerciseSession[];
  startTime: number;
  endTime?: number;
}
