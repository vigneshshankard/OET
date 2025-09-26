import * as z from 'zod';

// Common validation schemas

export const uuidSchema = z.string().uuid('Invalid UUID format');

export const emailSchema = z.string().email('Invalid email format');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number');

export const professionSchema = z.enum(['doctor', 'nurse', 'dentist', 'physiotherapist'], {
  errorMap: () => ({ message: 'Invalid profession' }),
});

export const difficultySchema = z.enum(['beginner', 'intermediate', 'advanced'], {
  errorMap: () => ({ message: 'Invalid difficulty level' }),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1, 'Page must be a positive integer').default(1),
  limit: z.coerce.number().int().min(1).max(100, 'Limit must be between 1 and 100').default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// User validation schemas
export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  profession: professionSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100).optional(),
  profession: professionSchema.optional(),
});

// Session validation schemas
export const createSessionSchema = z.object({
  scenarioId: uuidSchema,
});

export const updateSessionSchema = z.object({
  status: z.enum(['active', 'completed', 'cancelled']).optional(),
  durationSeconds: z.number().int().min(0).optional(),
});

// Scenario validation schemas
export const patientPersonaSchema = z.object({
  name: z.string().min(2, 'Patient name must be at least 2 characters'),
  age: z.number().int().min(0).max(120, 'Age must be between 0 and 120'),
  gender: z.enum(['male', 'female', 'other']),
  medicalHistory: z.array(z.string()),
  currentSymptoms: z.array(z.string()),
  personality: z.string().min(10, 'Personality description must be at least 10 characters'),
  communicationStyle: z.string().min(10, 'Communication style must be at least 10 characters'),
  culturalBackground: z.string().optional(),
  anxietyLevel: z.enum(['low', 'medium', 'high']),
});

export const createScenarioSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters').max(1000),
  patientPersona: patientPersonaSchema,
  clinicalArea: z.string().min(2, 'Clinical area is required'),
  difficultyLevel: difficultySchema,
  profession: professionSchema,
});

export const scenarioFiltersSchema = z.object({
  profession: professionSchema.optional(),
  clinicalArea: z.string().optional(),
  difficultyLevel: difficultySchema.optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  search: z.string().optional(),
});

// Subscription validation schemas
export const createSubscriptionSchema = z.object({
  planName: z.literal('paid'),
  paymentMethodId: z.string().min(1, 'Payment method is required'),
});

export const updateSubscriptionSchema = z.object({
  planName: z.enum(['free', 'paid']).optional(),
  status: z.enum(['active', 'cancelled', 'expired']).optional(),
});

// AI validation schemas
export const aiFeedbackRequestSchema = z.object({
  transcript: z.string().min(10, 'Transcript must be at least 10 characters'),
  scenarioId: uuidSchema,
  profession: professionSchema,
});

// Validation helper functions
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map((err: any) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    throw new ValidationError('Validation failed', errors);
  }
  return result.data;
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}