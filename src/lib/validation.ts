/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';

// Helper to sanitize strings by removing control characters and limiting length
export function sanitizeString(input: string, maxLength = 2000): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // remove ASCII control characters
    .trim()
    .slice(0, maxLength);
}

export function getZodErrorMessage(error: z.ZodError): string {
  return error.issues?.[0]?.message || error.message || 'Validation failed';
}

// User Profile Schema
export const UserProfileSchema = z.object({
  heightCm: z.number().min(50, 'Height must be at least 50 cm').max(300, 'Height must be under 300 cm'),
  weightKg: z.number().min(20, 'Weight must be at least 20 kg').max(500, 'Weight must be under 500 kg'),
  age: z.number().int().min(5, 'Age must be at least 5').max(120, 'Age must be under 120'),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'very', 'extra']).default('moderate'),
});

// User Nutrition Goals Schema
export const UserGoalsSchema = z.object({
  calorieTarget: z.number().min(500, 'Calorie target must be at least 500 kcal').max(10000, 'Calorie target must be under 10,000 kcal'),
  proteinTarget: z.number().min(0).max(1000),
  carbTarget: z.number().min(0).max(2000),
  fatTarget: z.number().min(0).max(1000),
});

// Food Log Item Schema
export const FoodLogItemSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  foodName: z.string().min(1, 'Food name cannot be empty').max(200, 'Food name too long'),
  quantity: z.number().positive().optional(),
  portion: z.string().max(100).optional(),
  calories: z.number().min(0).max(10000),
  proteinG: z.number().min(0).max(1000),
  carbsG: z.number().min(0).max(2000),
  fatG: z.number().min(0).max(1000),
  source: z.enum(['manual', 'photo', 'voice', 'text']).default('manual'),
  confidence: z.number().min(0).max(1).optional(),
  userConfirmed: z.boolean().default(true),
});

// Progress Entry Schema
export const ProgressEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  weightKg: z.number().min(20, 'Weight must be at least 20 kg').max(500, 'Weight must be under 500 kg'),
  bodyFatPercentage: z.number().min(1).max(70).nullable().optional(),
  notes: z.string().max(500).optional(),
});

// AI Endpoint Request Schemas
export const AnalyzePhotoRequestSchema = z.object({
  imageBase64: z.string().min(10, 'Missing or invalid base64 image data').max(15 * 1024 * 1024, 'Image too large (max 10MB)'),
  mimeType: z.string().regex(/^image\/(jpeg|png|webp|heic|gif)$/, 'Unsupported image format').default('image/jpeg'),
});

export const ExtractFoodTextRequestSchema = z.object({
  text: z.string().min(1, 'Text cannot be empty').max(2000, 'Text too long (max 2000 characters)'),
});

export const EstimateFoodRequestSchema = z.object({
  foodName: z.string().min(1, 'Food name cannot be empty').max(200, 'Food name too long'),
  quantity: z.string().max(100).optional(),
});

export const CalculateNutritionGoalsRequestSchema = z.object({
  heightCm: z.number().min(50).max(300),
  weightKg: z.number().min(20).max(500),
  age: z.number().int().min(5).max(120),
  activityLevel: z.string().max(50).default('moderate'),
  calorieTarget: z.number().min(500).max(10000).optional(),
});

export const AiChatRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long (max 2000 characters)'),
  context: z.record(z.string(), z.any()).optional(),
});
