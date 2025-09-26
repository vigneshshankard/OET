"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.aiFeedbackRequestSchema = exports.updateSubscriptionSchema = exports.createSubscriptionSchema = exports.scenarioFiltersSchema = exports.createScenarioSchema = exports.patientPersonaSchema = exports.updateSessionSchema = exports.createSessionSchema = exports.updateProfileSchema = exports.loginSchema = exports.createUserSchema = exports.paginationSchema = exports.difficultySchema = exports.professionSchema = exports.passwordSchema = exports.emailSchema = exports.uuidSchema = void 0;
exports.validateRequest = validateRequest;
const z = __importStar(require("zod"));
// Common validation schemas
exports.uuidSchema = z.string().uuid('Invalid UUID format');
exports.emailSchema = z.string().email('Invalid email format');
exports.passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number');
exports.professionSchema = z.enum(['doctor', 'nurse', 'dentist', 'physiotherapist'], {
    errorMap: () => ({ message: 'Invalid profession' }),
});
exports.difficultySchema = z.enum(['beginner', 'intermediate', 'advanced'], {
    errorMap: () => ({ message: 'Invalid difficulty level' }),
});
exports.paginationSchema = z.object({
    page: z.coerce.number().int().min(1, 'Page must be a positive integer').default(1),
    limit: z.coerce.number().int().min(1).max(100, 'Limit must be between 1 and 100').default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
});
// User validation schemas
exports.createUserSchema = z.object({
    email: exports.emailSchema,
    password: exports.passwordSchema,
    fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
    profession: exports.professionSchema,
});
exports.loginSchema = z.object({
    email: exports.emailSchema,
    password: z.string().min(1, 'Password is required'),
});
exports.updateProfileSchema = z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100).optional(),
    profession: exports.professionSchema.optional(),
});
// Session validation schemas
exports.createSessionSchema = z.object({
    scenarioId: exports.uuidSchema,
});
exports.updateSessionSchema = z.object({
    status: z.enum(['active', 'completed', 'cancelled']).optional(),
    durationSeconds: z.number().int().min(0).optional(),
});
// Scenario validation schemas
exports.patientPersonaSchema = z.object({
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
exports.createScenarioSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters').max(200),
    description: z.string().min(20, 'Description must be at least 20 characters').max(1000),
    patientPersona: exports.patientPersonaSchema,
    clinicalArea: z.string().min(2, 'Clinical area is required'),
    difficultyLevel: exports.difficultySchema,
    profession: exports.professionSchema,
});
exports.scenarioFiltersSchema = z.object({
    profession: exports.professionSchema.optional(),
    clinicalArea: z.string().optional(),
    difficultyLevel: exports.difficultySchema.optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    search: z.string().optional(),
});
// Subscription validation schemas
exports.createSubscriptionSchema = z.object({
    planName: z.literal('paid'),
    paymentMethodId: z.string().min(1, 'Payment method is required'),
});
exports.updateSubscriptionSchema = z.object({
    planName: z.enum(['free', 'paid']).optional(),
    status: z.enum(['active', 'cancelled', 'expired']).optional(),
});
// AI validation schemas
exports.aiFeedbackRequestSchema = z.object({
    transcript: z.string().min(10, 'Transcript must be at least 10 characters'),
    scenarioId: exports.uuidSchema,
    profession: exports.professionSchema,
});
// Validation helper functions
function validateRequest(schema, data) {
    const result = schema.safeParse(data);
    if (!result.success) {
        const errors = result.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
        }));
        throw new ValidationError('Validation failed', errors);
    }
    return result.data;
}
class ValidationError extends Error {
    constructor(message, errors) {
        super(message);
        this.errors = errors;
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
//# sourceMappingURL=schemas.js.map