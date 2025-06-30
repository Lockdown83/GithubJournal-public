import { 
  exportWorkoutsToJSON, 
  exportWorkoutsToCSV, 
  generateWorkoutReport,
  formatWorkoutData 
} from '../../utils/workoutExport';
import { Workout, WorkoutExercise, ExportOptions } from '../../types/workout';

describe('WorkoutExport', () => {
  const mockWorkouts: Workout[] = [
    {
      id: 'w1',
      name: 'Push Day',
      date: new Date('2024-01-15T10:00:00Z'),
      exercises: [
        {
          id: 'we1',
          exerciseId: 'ex1',
          exercise: {
            id: 'ex1',
            name: 'Bench Press',
            muscle_groups: ['chest', 'triceps'],
            equipment: 'barbell',
          },
          sets: [
            { id: 'set1', reps: 10, weight: 135, restTime: 90 },
            { id: 'set2', reps: 8, weight: 145, restTime: 90 },
            { id: 'set3', reps: 6, weight: 155, restTime: 120 },
          ],
          notes: 'Good form throughout',
        },
        {
          id: 'we2',
          exerciseId: 'ex2',
          exercise: {
            id: 'ex2',
            name: 'Overhead Press',
            muscle_groups: ['shoulders', 'triceps'],
            equipment: 'barbell',
          },
          sets: [
            { id: 'set4', reps: 8, weight: 95, restTime: 60 },
            { id: 'set5', reps: 6, weight: 105, restTime: 90 },
          ],
        },
      ],
      duration: 75,
      isCompleted: true,
      tags: ['strength', 'push'],
      notes: 'Great session, felt strong',
    },
    {
      id: 'w2',
      name: 'Pull Day',
      date: new Date('2024-01-17T14:30:00Z'),
      exercises: [
        {
          id: 'we3',
          exerciseId: 'ex3',
          exercise: {
            id: 'ex3',
            name: 'Deadlift',
            muscle_groups: ['hamstrings', 'glutes', 'lower_back'],
            equipment: 'barbell',
          },
          sets: [
            { id: 'set6', reps: 5, weight: 225, restTime: 180 },
            { id: 'set7', reps: 5, weight: 235, restTime: 180 },
            { id: 'set8', reps: 3, weight: 245, restTime: 180 },
          ],
        },
      ],
      duration: 60,
      isCompleted: true,
      tags: ['strength', 'pull'],
    },
  ];

  describe('exportWorkoutsToJSON', () => {
    it('should export workouts to JSON format', () => {
      const result = exportWorkoutsToJSON(mockWorkouts);

      expect(typeof result).toBe('string');
      const parsed = JSON.parse(result);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].name).toBe('Push Day');
      expect(parsed[0].exercises).toHaveLength(2);
    });

    it('should handle empty workout array', () => {
      const result = exportWorkoutsToJSON([]);

      expect(result).toBe('[]');
    });

    it('should preserve all workout data fields', () => {
      const result = exportWorkoutsToJSON([mockWorkouts[0]]);
      const parsed = JSON.parse(result)[0];

      expect(parsed.id).toBe(mockWorkouts[0].id);
      expect(parsed.name).toBe(mockWorkouts[0].name);
      expect(parsed.duration).toBe(mockWorkouts[0].duration);
      expect(parsed.notes).toBe(mockWorkouts[0].notes);
      expect(parsed.tags).toEqual(mockWorkouts[0].tags);
      expect(parsed.exercises[0].sets).toHaveLength(3);
    });

    it('should handle workouts with notes', () => {
      const workoutWithNotes = {
        ...mockWorkouts[0],
        exercises: [
          {
            ...mockWorkouts[0].exercises[0],
            notes: 'Focus on form',
          },
        ],
      };

      const result = exportWorkoutsToJSON([workoutWithNotes]);
      const parsed = JSON.parse(result)[0];

      expect(parsed.exercises[0].notes).toBe('Focus on form');
    });
  });

  describe('exportWorkoutsToCSV', () => {
    it('should export workouts to CSV format', () => {
      const result = exportWorkoutsToCSV(mockWorkouts);

      expect(typeof result).toBe('string');
      const lines = result.split('\n');
      expect(lines[0]).toContain('Date,Workout,Exercise,Set,Reps,Weight,Rest');
      expect(lines[1]).toContain('2024-01-15');
      expect(lines[1]).toContain('Push Day');
      expect(lines[1]).toContain('Bench Press');
    });

    it('should handle missing weight values', () => {
      const workoutWithBodyweight = {
        ...mockWorkouts[0],
        exercises: [
          {
            ...mockWorkouts[0].exercises[0],
            sets: [
              { id: 'set1', reps: 10, restTime: 60 }, // No weight
            ],
          },
        ],
      };

      const result = exportWorkoutsToCSV([workoutWithBodyweight]);
      const lines = result.split('\n');

      expect(lines[1]).toContain(',,'); // Empty weight field
    });

    it('should format dates correctly in CSV', () => {
      const result = exportWorkoutsToCSV(mockWorkouts);
      const lines = result.split('\n');

      expect(lines[1]).toMatch(/^\d{4}-\d{2}-\d{2}/); // YYYY-MM-DD format
    });

    it('should escape commas in workout names', () => {
      const workoutWithComma = {
        ...mockWorkouts[0],
        name: 'Push Day, Heavy Session',
      };

      const result = exportWorkoutsToCSV([workoutWithComma]);
      const lines = result.split('\n');

      expect(lines[1]).toContain('"Push Day, Heavy Session"');
    });

    it('should include all sets for each exercise', () => {
      const result = exportWorkoutsToCSV([mockWorkouts[0]]);
      const lines = result.split('\n').filter(line => line.trim());

      // Header + 5 sets (3 bench + 2 overhead)
      expect(lines).toHaveLength(6);
    });
  });

  describe('formatWorkoutData', () => {
    it('should calculate total volume for workout', () => {
      const formatted = formatWorkoutData(mockWorkouts[0]);

      expect(formatted.totalVolume).toBe(
        (135 * 10) + (145 * 8) + (155 * 6) + (95 * 8) + (105 * 6)
      );
    });

    it('should calculate total sets', () => {
      const formatted = formatWorkoutData(mockWorkouts[0]);

      expect(formatted.totalSets).toBe(5);
    });

    it('should identify heaviest set', () => {
      const formatted = formatWorkoutData(mockWorkouts[0]);

      expect(formatted.heaviestSet).toEqual({
        exercise: 'Bench Press',
        weight: 155,
        reps: 6,
      });
    });

    it('should handle workouts with no weight', () => {
      const bodyweightWorkout = {
        ...mockWorkouts[0],
        exercises: [
          {
            ...mockWorkouts[0].exercises[0],
            exercise: {
              ...mockWorkouts[0].exercises[0].exercise,
              name: 'Push-ups',
            },
            sets: [
              { id: 'set1', reps: 20, restTime: 60 },
              { id: 'set2', reps: 18, restTime: 60 },
            ],
          },
        ],
      };

      const formatted = formatWorkoutData(bodyweightWorkout);

      expect(formatted.totalVolume).toBe(0);
      expect(formatted.totalSets).toBe(2);
      expect(formatted.heaviestSet).toBeNull();
    });
  });

  describe('generateWorkoutReport', () => {
    it('should generate comprehensive workout report', () => {
      const report = generateWorkoutReport(mockWorkouts);

      expect(report.totalWorkouts).toBe(2);
      expect(report.totalDuration).toBe(135); // 75 + 60
      expect(report.averageDuration).toBe(67.5);
      expect(report.totalVolume).toBeGreaterThan(0);
      expect(report.mostFrequentExercises).toBeDefined();
      expect(report.strengthProgressions).toBeDefined();
    });

    it('should identify most frequent exercises', () => {
      const workoutsWithRepeats = [
        ...mockWorkouts,
        {
          ...mockWorkouts[0],
          id: 'w3',
          exercises: [mockWorkouts[0].exercises[0]], // Bench press again
        },
      ];

      const report = generateWorkoutReport(workoutsWithRepeats);

      expect(report.mostFrequentExercises[0]).toEqual({
        name: 'Bench Press',
        count: 2,
      });
    });

    it('should track strength progressions', () => {
      const progressionWorkouts = [
        mockWorkouts[0],
        {
          ...mockWorkouts[0],
          id: 'w3',
          date: new Date('2024-01-22T10:00:00Z'),
          exercises: [
            {
              ...mockWorkouts[0].exercises[0],
              sets: [
                { id: 'set9', reps: 10, weight: 140, restTime: 90 }, // Progress!
              ],
            },
          ],
        },
      ];

      const report = generateWorkoutReport(progressionWorkouts);

      expect(report.strengthProgressions['Bench Press']).toBeDefined();
      expect(report.strengthProgressions['Bench Press'].improvement).toBeGreaterThan(0);
    });

    it('should calculate workout frequency', () => {
      const report = generateWorkoutReport(mockWorkouts);

      expect(report.averageFrequency).toBeDefined();
      expect(typeof report.averageFrequency).toBe('number');
    });
  });

  describe('export with options', () => {
    const exportOptions: ExportOptions = {
      format: 'json',
      dateRange: {
        start: new Date('2024-01-14'),
        end: new Date('2024-01-16'),
      },
      includeNotes: false,
      groupByDate: true,
    };

    it('should filter by date range when specified', () => {
      const filteredWorkouts = mockWorkouts.filter(workout => {
        const workoutDate = new Date(workout.date);
        return workoutDate >= exportOptions.dateRange!.start && 
               workoutDate <= exportOptions.dateRange!.end;
      });

      expect(filteredWorkouts).toHaveLength(1);
      expect(filteredWorkouts[0].id).toBe('w1');
    });

    it('should exclude notes when specified', () => {
      const workoutData = mockWorkouts.map(workout => ({
        ...workout,
        notes: exportOptions.includeNotes ? workout.notes : undefined,
        exercises: workout.exercises.map(exercise => ({
          ...exercise,
          notes: exportOptions.includeNotes ? exercise.notes : undefined,
        })),
      }));

      expect(workoutData[0].notes).toBeUndefined();
      expect(workoutData[0].exercises[0].notes).toBeUndefined();
    });

    it('should group by date when specified', () => {
      const grouped = mockWorkouts.reduce((acc, workout) => {
        const dateKey = workout.date.toISOString().split('T')[0];
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(workout);
        return acc;
      }, {} as Record<string, Workout[]>);

      expect(Object.keys(grouped)).toHaveLength(2);
      expect(grouped['2024-01-15']).toHaveLength(1);
      expect(grouped['2024-01-17']).toHaveLength(1);
    });
  });

  describe('error handling', () => {
    it('should handle invalid workout data gracefully', () => {
      const invalidWorkouts = [
        { id: 'invalid', name: null, exercises: [] },
      ] as any;

      expect(() => exportWorkoutsToJSON(invalidWorkouts)).not.toThrow();
    });

    it('should handle empty exercises array', () => {
      const emptyWorkout = {
        ...mockWorkouts[0],
        exercises: [],
      };

      const csvResult = exportWorkoutsToCSV([emptyWorkout]);
      const lines = csvResult.split('\n').filter(line => line.trim());

      expect(lines).toHaveLength(1); // Only header
    });

    it('should handle circular references in data', () => {
      const circularWorkout = { ...mockWorkouts[0] };
      (circularWorkout as any).self = circularWorkout;

      // Should not throw
      expect(() => JSON.stringify(circularWorkout)).toThrow();
      expect(() => exportWorkoutsToJSON([circularWorkout])).toThrow();
    });
  });
});