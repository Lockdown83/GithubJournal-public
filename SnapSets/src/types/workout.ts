export interface Exercise {
  id: string;
  name: string;
  muscle_groups: string[];
  instructions?: string;
  equipment?: string;
}

export interface WorkoutSet {
  id: string;
  reps: number;
  weight?: number;
  duration?: number; // in seconds
  restTime?: number; // in seconds
  notes?: string;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  sets: WorkoutSet[];
  notes?: string;
}

export interface Workout {
  id: string;
  name: string;
  date: Date;
  exercises: WorkoutExercise[];
  duration?: number; // in minutes
  notes?: string;
  isCompleted: boolean;
  tags?: string[];
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: Omit<WorkoutExercise, 'sets'>[];
  tags?: string[];
  isDefault?: boolean;
}

export interface WorkoutHistory {
  workouts: Workout[];
  templates: WorkoutTemplate[];
}

export interface WorkoutStats {
  totalWorkouts: number;
  totalExercises: number;
  totalSets: number;
  totalWeight: number;
  averageDuration: number;
  favoriteExercises: Exercise[];
}

export type ExportFormat = 'json' | 'csv' | 'pdf';

export interface ExportOptions {
  format: ExportFormat;
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeNotes?: boolean;
  groupByDate?: boolean;
}