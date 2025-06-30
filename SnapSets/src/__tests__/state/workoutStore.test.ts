import { WorkoutStore } from '../../state/workoutStore';
import { Workout, WorkoutExercise, WorkoutSet, Exercise } from '../../types/workout';

// Mock AsyncStorage
const mockAsyncStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

describe('WorkoutStore', () => {
  let store: WorkoutStore;

  const mockExercise: Exercise = {
    id: 'ex1',
    name: 'Squat',
    muscle_groups: ['quadriceps', 'glutes'],
    instructions: 'Stand with feet shoulder-width apart...',
    equipment: 'barbell',
  };

  const mockWorkoutSet: WorkoutSet = {
    id: 'set1',
    reps: 10,
    weight: 135,
    restTime: 90,
    notes: 'Good form',
  };

  const mockWorkoutExercise: WorkoutExercise = {
    id: 'we1',
    exerciseId: 'ex1',
    exercise: mockExercise,
    sets: [mockWorkoutSet],
    notes: 'Focus on depth',
  };

  const mockWorkout: Workout = {
    id: 'w1',
    name: 'Push Day',
    date: new Date('2024-01-15'),
    exercises: [mockWorkoutExercise],
    duration: 60,
    notes: 'Great session',
    isCompleted: false,
    tags: ['strength', 'push'],
  };

  beforeEach(() => {
    store = new WorkoutStore();
    mockAsyncStorage.getItem.mockClear();
    mockAsyncStorage.setItem.mockClear();
    mockAsyncStorage.removeItem.mockClear();
    mockAsyncStorage.clear.mockClear();
  });

  describe('initialization', () => {
    it('should initialize with empty state', () => {
      expect(store.getState().workouts).toEqual([]);
      expect(store.getState().currentWorkout).toBeNull();
      expect(store.getState().isLoading).toBe(false);
    });

    it('should load workouts from storage on initialization', async () => {
      const storedWorkouts = [mockWorkout];
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(storedWorkouts));

      await store.loadFromStorage();

      expect(store.getState().workouts).toEqual(storedWorkouts);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('workouts');
    });

    it('should handle corrupted storage data gracefully', async () => {
      mockAsyncStorage.getItem.mockResolvedValueOnce('invalid json');

      await store.loadFromStorage();

      expect(store.getState().workouts).toEqual([]);
      expect(store.getState().error).toContain('Failed to load');
    });
  });

  describe('workout management', () => {
    it('should create a new workout', async () => {
      const workoutData = {
        name: 'New Workout',
        exercises: [mockWorkoutExercise],
      };

      const createdWorkout = await store.createWorkout(workoutData);

      expect(createdWorkout.name).toBe(workoutData.name);
      expect(createdWorkout.exercises).toEqual(workoutData.exercises);
      expect(createdWorkout.id).toBeDefined();
      expect(createdWorkout.date).toBeInstanceOf(Date);
      expect(store.getState().workouts).toContain(createdWorkout);
    });

    it('should update an existing workout', async () => {
      // Add workout first
      await store.createWorkout(mockWorkout);

      const updates = {
        name: 'Updated Workout',
        isCompleted: true,
      };

      const updatedWorkout = await store.updateWorkout(mockWorkout.id, updates);

      expect(updatedWorkout.name).toBe(updates.name);
      expect(updatedWorkout.isCompleted).toBe(true);
      expect(store.getState().workouts[0]).toEqual(updatedWorkout);
    });

    it('should delete a workout', async () => {
      await store.createWorkout(mockWorkout);
      expect(store.getState().workouts).toHaveLength(1);

      await store.deleteWorkout(mockWorkout.id);

      expect(store.getState().workouts).toHaveLength(0);
    });

    it('should handle delete of non-existent workout', async () => {
      const result = await store.deleteWorkout('non-existent');

      expect(result).toBe(false);
      expect(store.getState().error).toContain('Workout not found');
    });
  });

  describe('current workout management', () => {
    it('should start a new workout', () => {
      store.startWorkout('Morning Session');

      const currentWorkout = store.getState().currentWorkout;
      expect(currentWorkout).not.toBeNull();
      expect(currentWorkout!.name).toBe('Morning Session');
      expect(currentWorkout!.isCompleted).toBe(false);
    });

    it('should add exercise to current workout', () => {
      store.startWorkout('Test Workout');
      store.addExerciseToCurrentWorkout(mockExercise);

      const currentWorkout = store.getState().currentWorkout;
      expect(currentWorkout!.exercises).toHaveLength(1);
      expect(currentWorkout!.exercises[0].exercise).toEqual(mockExercise);
    });

    it('should add set to exercise in current workout', () => {
      store.startWorkout('Test Workout');
      store.addExerciseToCurrentWorkout(mockExercise);

      const newSet = { reps: 12, weight: 140 };
      store.addSetToExercise(mockExercise.id, newSet);

      const currentWorkout = store.getState().currentWorkout;
      const exercise = currentWorkout!.exercises[0];
      expect(exercise.sets).toHaveLength(1);
      expect(exercise.sets[0]).toMatchObject(newSet);
    });

    it('should finish current workout', async () => {
      store.startWorkout('Test Workout');
      store.addExerciseToCurrentWorkout(mockExercise);

      const finishedWorkout = await store.finishCurrentWorkout();

      expect(finishedWorkout.isCompleted).toBe(true);
      expect(store.getState().currentWorkout).toBeNull();
      expect(store.getState().workouts).toContain(finishedWorkout);
    });

    it('should handle finishing workout with no current workout', async () => {
      const result = await store.finishCurrentWorkout();

      expect(result).toBeNull();
      expect(store.getState().error).toContain('No active workout');
    });
  });

  describe('workout statistics', () => {
    beforeEach(async () => {
      // Add some test workouts
      await store.createWorkout({
        ...mockWorkout,
        isCompleted: true,
        exercises: [mockWorkoutExercise],
      });
      await store.createWorkout({
        ...mockWorkout,
        id: 'w2',
        name: 'Pull Day',
        isCompleted: true,
        exercises: [
          {
            ...mockWorkoutExercise,
            id: 'we2',
            sets: [mockWorkoutSet, { ...mockWorkoutSet, id: 'set2', weight: 140 }],
          },
        ],
      });
    });

    it('should calculate total workouts', () => {
      const stats = store.getWorkoutStats();
      expect(stats.totalWorkouts).toBe(2);
    });

    it('should calculate total exercises and sets', () => {
      const stats = store.getWorkoutStats();
      expect(stats.totalExercises).toBe(2);
      expect(stats.totalSets).toBe(3);
    });

    it('should calculate total weight lifted', () => {
      const stats = store.getWorkoutStats();
      const expectedWeight = (135 * 10) + (135 * 10) + (140 * 10); // reps * weight for each set
      expect(stats.totalWeight).toBe(expectedWeight);
    });

    it('should calculate average workout duration', () => {
      const stats = store.getWorkoutStats();
      expect(stats.averageDuration).toBe(60); // Both workouts have 60 min duration
    });
  });

  describe('data filtering and search', () => {
    beforeEach(async () => {
      await store.createWorkout(mockWorkout);
      await store.createWorkout({
        ...mockWorkout,
        id: 'w2',
        name: 'Pull Day',
        tags: ['strength', 'pull'],
        date: new Date('2024-01-20'),
      });
    });

    it('should filter workouts by date range', () => {
      const filtered = store.getWorkoutsByDateRange(
        new Date('2024-01-14'),
        new Date('2024-01-16')
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('w1');
    });

    it('should filter workouts by tags', () => {
      const pushWorkouts = store.getWorkoutsByTag('push');
      const pullWorkouts = store.getWorkoutsByTag('pull');

      expect(pushWorkouts).toHaveLength(1);
      expect(pullWorkouts).toHaveLength(1);
      expect(pushWorkouts[0].id).toBe('w1');
      expect(pullWorkouts[0].id).toBe('w2');
    });

    it('should search workouts by name', () => {
      const searchResults = store.searchWorkouts('Push');

      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].name).toBe('Push Day');
    });

    it('should search workouts by exercise name', () => {
      const searchResults = store.searchWorkouts('Squat');

      expect(searchResults).toHaveLength(2); // Both workouts contain squat
    });
  });

  describe('data persistence', () => {
    it('should save workouts to storage when workout is created', async () => {
      await store.createWorkout(mockWorkout);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'workouts',
        expect.stringContaining(mockWorkout.name)
      );
    });

    it('should save workouts to storage when workout is updated', async () => {
      await store.createWorkout(mockWorkout);
      mockAsyncStorage.setItem.mockClear();

      await store.updateWorkout(mockWorkout.id, { name: 'Updated' });

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'workouts',
        expect.stringContaining('Updated')
      );
    });

    it('should handle storage errors gracefully', async () => {
      mockAsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage error'));

      await store.createWorkout(mockWorkout);

      expect(store.getState().error).toContain('Failed to save');
    });
  });

  describe('error handling', () => {
    it('should clear errors when new operations succeed', async () => {
      // Cause an error
      mockAsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage error'));
      await store.createWorkout(mockWorkout);
      expect(store.getState().error).toBeDefined();

      // Successful operation should clear error
      mockAsyncStorage.setItem.mockResolvedValueOnce(undefined);
      await store.createWorkout({ ...mockWorkout, id: 'w2' });
      
      expect(store.getState().error).toBeNull();
    });

    it('should validate workout data before saving', async () => {
      const invalidWorkout = { name: '', exercises: [] };

      const result = await store.createWorkout(invalidWorkout as any);

      expect(result).toBeNull();
      expect(store.getState().error).toContain('Invalid workout data');
    });
  });
});