/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  heightCm: number;
  weightKg: number;
  age: number;
  activityLevel: string;
}

export interface UserGoals {
  calorieTarget: number;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
}

export interface FoodLogItem {
  id?: string;
  date?: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodName: string;
  quantity?: number;
  portion?: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  source: 'manual' | 'photo' | 'voice' | 'text';
  estimatedByAI?: boolean;
  confidence?: number;
  userConfirmed: boolean;
  createdAt: any;
}

export interface WorkoutExerciseSet {
  setNumber: number;
  weightKg: number;
  reps: number;
  completed?: boolean;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  sets: WorkoutExerciseSet[];
}

export interface WorkoutPlan {
  id?: string;
  title: string;
  description: string;
  exercises: { name: string; defaultSets: number; defaultReps: number }[];
}

export interface WorkoutSession {
  id?: string;
  planTitle: string;
  date: string;
  exercises: WorkoutExercise[];
  completed: boolean;
  durationMinutes: number;
  createdAt: any;
}

export interface ProgressEntry {
  id?: string;
  date: string;
  weightKg: number;
  bodyFatPercentage?: number;
  notes?: string;
  createdAt: any;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}
