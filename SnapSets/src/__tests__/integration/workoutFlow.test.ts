import { WorkoutStore } from '../../state/workoutStore';
import { VisionService } from '../../api/vision-service';
import { exportWorkoutsToJSON } from '../../utils/workoutExport';
import { Exercise, Workout } from '../../types/workout';

// Mock dependencies
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

const mockAsyncStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

describe('Workout Flow Integration', () => {
  let workoutStore: WorkoutStore;
  let visionService: VisionService;

  const mockExercise: Exercise = {
    id: 'ex1',
    name: 'Bench Press',
    muscle_groups: ['chest', 'triceps'],
    equipment: 'barbell',
    instructions: 'Lie on bench and press weight up',
  };

  beforeEach(() => {
    workoutStore = new WorkoutStore();
    visionService = new VisionService('test-api-key');
    
    // Clear all mocks
    mockFetch.mockClear();
    mockAsyncStorage.getItem.mockClear();
    mockAsyncStorage.setItem.mockClear();
    mockAsyncStorage.removeItem.mockClear();
    mockAsyncStorage.clear.mockClear();
  });

  describe('Complete workout session', () => {
    it('should handle full workout creation to completion flow', async () => {
      // 1. Start a new workout
      workoutStore.startWorkout('Morning Push Session');
      
      let currentWorkout = workoutStore.getState().currentWorkout;
      expect(currentWorkout).not.toBeNull();
      expect(currentWorkout!.name).toBe('Morning Push Session');
      expect(currentWorkout!.isCompleted).toBe(false);

      // 2. Add exercise to workout
      workoutStore.addExerciseToCurrentWorkout(mockExercise);
      
      currentWorkout = workoutStore.getState().currentWorkout;
      expect(currentWorkout!.exercises).toHaveLength(1);
      expect(currentWorkout!.exercises[0].exercise.name).toBe('Bench Press');

      // 3. Add sets to the exercise
      const set1 = { reps: 10, weight: 135, restTime: 90 };
      const set2 = { reps: 8, weight: 145, restTime: 90 };
      const set3 = { reps: 6, weight: 155, restTime: 120 };

      workoutStore.addSetToExercise(mockExercise.id, set1);
      workoutStore.addSetToExercise(mockExercise.id, set2);
      workoutStore.addSetToExercise(mockExercise.id, set3);

      currentWorkout = workoutStore.getState().currentWorkout;
      expect(currentWorkout!.exercises[0].sets).toHaveLength(3);

      // 4. Finish the workout
      mockAsyncStorage.setItem.mockResolvedValueOnce(undefined);
      const finishedWorkout = await workoutStore.finishCurrentWorkout();

      expect(finishedWorkout).not.toBeNull();
      expect(finishedWorkout!.isCompleted).toBe(true);
      expect(workoutStore.getState().currentWorkout).toBeNull();
      expect(workoutStore.getState().workouts).toContain(finishedWorkout);

      // 5. Verify workout was saved to storage
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'workouts',
        expect.any(String)
      );
    });

    it('should handle workout with AI form analysis', async () => {
      // Start workout and add exercise
      workoutStore.startWorkout('AI-Assisted Session');
      workoutStore.addExerciseToCurrentWorkout(mockExercise);

      // Mock successful vision analysis
      const mockAnalysisResponse = {
        success: true,
        analysis: {
          exerciseDetected: 'Bench Press',
          formFeedback: ['Keep elbows tucked', 'Good bar path'],
          confidence: 0.88,
          suggestions: ['Consider slightly wider grip'],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalysisResponse,
      });

      // Analyze form with AI
      const analysisRequest = {
        imageData: 'base64-image-data',
        analysisType: 'exercise_form' as const,
        exerciseContext: {
          exerciseName: mockExercise.name,
          targetMuscles: mockExercise.muscle_groups,
        },
      };

      const analysisResult = await visionService.analyzeImage(analysisRequest);

      expect(analysisResult.success).toBe(true);
      expect(analysisResult.analysis?.exerciseDetected).toBe('Bench Press');
      expect(analysisResult.analysis?.formFeedback).toHaveLength(2);

      // Add set with AI feedback notes
      const setWithFeedback = {
        reps: 10,
        weight: 135,
        restTime: 90,
        notes: `AI Feedback: ${analysisResult.analysis?.formFeedback?.join(', ')}`,
      };

      workoutStore.addSetToExercise(mockExercise.id, setWithFeedback);

      const currentWorkout = workoutStore.getState().currentWorkout;
      expect(currentWorkout!.exercises[0].sets[0].notes).toContain('AI Feedback');
    });
  });

  describe('Data persistence and export', () => {
    it('should persist and export workout data', async () => {
      // Create multiple workouts
      const workout1 = await workoutStore.createWorkout({
        name: 'Push Day',
        exercises: [
          {
            id: 'we1',
            exerciseId: mockExercise.id,
            exercise: mockExercise,
            sets: [
              { id: 'set1', reps: 10, weight: 135, restTime: 90 },
              { id: 'set2', reps: 8, weight: 145, restTime: 90 },
            ],
          },
        ],
        tags: ['strength', 'push'],
      });

      const workout2 = await workoutStore.createWorkout({
        name: 'Pull Day',
        exercises: [
          {
            id: 'we2',
            exerciseId: 'ex2',
            exercise: {
              id: 'ex2',
              name: 'Deadlift',
              muscle_groups: ['hamstrings', 'glutes'],
              equipment: 'barbell',
            },
            sets: [
              { id: 'set3', reps: 5, weight: 225, restTime: 180 },
            ],
          },
        ],
        tags: ['strength', 'pull'],
      });

      // Verify workouts are stored
      const allWorkouts = workoutStore.getState().workouts;
      expect(allWorkouts).toHaveLength(2);

      // Test export functionality
      const exportedData = exportWorkoutsToJSON(allWorkouts);
      const parsedData = JSON.parse(exportedData);

      expect(parsedData).toHaveLength(2);
      expect(parsedData[0].name).toBe('Push Day');
      expect(parsedData[1].name).toBe('Pull Day');

      // Verify data integrity
      expect(parsedData[0].exercises[0].sets).toHaveLength(2);
      expect(parsedData[1].exercises[0].sets).toHaveLength(1);
    });

    it('should handle data recovery from storage', async () => {
      // Mock stored workout data
      const storedWorkouts = [
        {
          id: 'w1',
          name: 'Stored Workout',
          date: new Date().toISOString(),
          exercises: [
            {
              id: 'we1',
              exerciseId: mockExercise.id,
              exercise: mockExercise,
              sets: [
                { id: 'set1', reps: 10, weight: 135, restTime: 90 },
              ],
            },
          ],
          isCompleted: true,
          tags: ['recovery-test'],
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValueOnce(
        JSON.stringify(storedWorkouts)
      );

      // Load workouts from storage
      await workoutStore.loadFromStorage();

      const loadedWorkouts = workoutStore.getState().workouts;
      expect(loadedWorkouts).toHaveLength(1);
      expect(loadedWorkouts[0].name).toBe('Stored Workout');
      expect(loadedWorkouts[0].exercises[0].exercise.name).toBe('Bench Press');
    });
  });

  describe('Statistics and analytics', () => {
    it('should generate accurate workout statistics', async () => {
      // Create workouts with various data
      await workoutStore.createWorkout({
        name: 'Workout 1',
        duration: 60,
        exercises: [
          {
            id: 'we1',
            exerciseId: mockExercise.id,
            exercise: mockExercise,
            sets: [
              { id: 'set1', reps: 10, weight: 135, restTime: 90 },
              { id: 'set2', reps: 8, weight: 145, restTime: 90 },
            ],
          },
        ],
        isCompleted: true,
      });

      await workoutStore.createWorkout({
        name: 'Workout 2',
        duration: 75,
        exercises: [
          {
            id: 'we2',
            exerciseId: 'ex2',
            exercise: {
              id: 'ex2',
              name: 'Squat',
              muscle_groups: ['quadriceps', 'glutes'],
              equipment: 'barbell',
            },
            sets: [
              { id: 'set3', reps: 12, weight: 185, restTime: 120 },
              { id: 'set4', reps: 10, weight: 195, restTime: 120 },
              { id: 'set5', reps: 8, weight: 205, restTime: 150 },
            ],
          },
        ],
        isCompleted: true,
      });

      // Generate statistics
      const stats = workoutStore.getWorkoutStats();

      expect(stats.totalWorkouts).toBe(2);
      expect(stats.totalExercises).toBe(2);
      expect(stats.totalSets).toBe(5);
      expect(stats.averageDuration).toBe(67.5); // (60 + 75) / 2

      // Calculate expected total weight
      const expectedWeight = 
        (135 * 10) + (145 * 8) + // Bench press sets
        (185 * 12) + (195 * 10) + (205 * 8); // Squat sets
      
      expect(stats.totalWeight).toBe(expectedWeight);
    });

    it('should track progress over time', async () => {
      const baseDate = new Date('2024-01-01');
      
      // Create progressive workouts
      const progressiveWorkouts = [
        {
          name: 'Week 1 Bench',
          date: new Date(baseDate.getTime()),
          exercises: [{
            id: 'we1',
            exerciseId: mockExercise.id,
            exercise: mockExercise,
            sets: [{ id: 'set1', reps: 10, weight: 135, restTime: 90 }],
          }],
          isCompleted: true,
        },
        {
          name: 'Week 2 Bench',
          date: new Date(baseDate.getTime() + (7 * 24 * 60 * 60 * 1000)),
          exercises: [{
            id: 'we2',
            exerciseId: mockExercise.id,
            exercise: mockExercise,
            sets: [{ id: 'set2', reps: 10, weight: 140, restTime: 90 }],
          }],
          isCompleted: true,
        },
        {
          name: 'Week 3 Bench',
          date: new Date(baseDate.getTime() + (14 * 24 * 60 * 60 * 1000)),
          exercises: [{
            id: 'we3',
            exerciseId: mockExercise.id,
            exercise: mockExercise,
            sets: [{ id: 'set3', reps: 10, weight: 145, restTime: 90 }],
          }],
          isCompleted: true,
        },
      ];

      // Create workouts
      for (const workoutData of progressiveWorkouts) {
        await workoutStore.createWorkout(workoutData);
      }

      // Verify progression tracking
      const workouts = workoutStore.getState().workouts;
      expect(workouts).toHaveLength(3);
      
      // Check weight progression
      const benchPressWeights = workouts
        .flatMap(w => w.exercises)
        .filter(e => e.exercise.name === 'Bench Press')
        .flatMap(e => e.sets)
        .map(s => s.weight)
        .filter(w => w !== undefined);

      expect(benchPressWeights).toEqual([135, 140, 145]);
    });
  });

  describe('Error handling and recovery', () => {
    it('should handle API failures gracefully', async () => {
      // Start workout
      workoutStore.startWorkout('Error Test Session');
      workoutStore.addExerciseToCurrentWorkout(mockExercise);

      // Mock API failure
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const analysisRequest = {
        imageData: 'base64-image-data',
        analysisType: 'exercise_form' as const,
      };

      const result = await visionService.analyzeImage(analysisRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');

      // Workout should continue without AI analysis
      workoutStore.addSetToExercise(mockExercise.id, { reps: 10, weight: 135 });
      
      const currentWorkout = workoutStore.getState().currentWorkout;
      expect(currentWorkout!.exercises[0].sets).toHaveLength(1);
    });

    it('should handle storage failures with retry logic', async () => {
      workoutStore.startWorkout('Storage Test');
      workoutStore.addExerciseToCurrentWorkout(mockExercise);

      // First save attempt fails
      mockAsyncStorage.setItem.mockRejectedValueOnce(new Error('Storage full'));
      
      let finishedWorkout = await workoutStore.finishCurrentWorkout();
      expect(workoutStore.getState().error).toContain('Failed to save');

      // Retry should work
      mockAsyncStorage.setItem.mockResolvedValueOnce(undefined);
      
      // Clear error and try again
      workoutStore.startWorkout('Retry Test');
      workoutStore.addExerciseToCurrentWorkout(mockExercise);
      finishedWorkout = await workoutStore.finishCurrentWorkout();

      expect(finishedWorkout).not.toBeNull();
      expect(workoutStore.getState().error).toBeNull();
    });

    it('should maintain data consistency during concurrent operations', async () => {
      // Simulate concurrent workout operations
      const promises = [
        workoutStore.createWorkout({
          name: 'Concurrent 1',
          exercises: [
            {
              id: 'we1',
              exerciseId: mockExercise.id,
              exercise: mockExercise,
              sets: [{ id: 'set1', reps: 10, weight: 135 }],
            },
          ],
        }),
        workoutStore.createWorkout({
          name: 'Concurrent 2',
          exercises: [
            {
              id: 'we2',
              exerciseId: mockExercise.id,
              exercise: mockExercise,
              sets: [{ id: 'set2', reps: 8, weight: 145 }],
            },
          ],
        }),
      ];

      const results = await Promise.all(promises);

      // Both workouts should be created successfully
      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('Concurrent 1');
      expect(results[1].name).toBe('Concurrent 2');

      // State should be consistent
      const workouts = workoutStore.getState().workouts;
      expect(workouts).toHaveLength(2);
    });
  });
});