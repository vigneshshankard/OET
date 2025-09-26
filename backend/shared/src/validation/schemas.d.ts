import * as z from 'zod';
export declare const uuidSchema: z.ZodString;
export declare const emailSchema: z.ZodString;
export declare const passwordSchema: z.ZodString;
export declare const professionSchema: z.ZodEnum<["doctor", "nurse", "dentist", "physiotherapist"]>;
export declare const difficultySchema: z.ZodEnum<["beginner", "intermediate", "advanced"]>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortOrder: "asc" | "desc";
    sortBy?: string | undefined;
}, {
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export declare const createUserSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    fullName: z.ZodString;
    profession: z.ZodEnum<["doctor", "nurse", "dentist", "physiotherapist"]>;
}, "strip", z.ZodTypeAny, {
    password: string;
    email: string;
    fullName: string;
    profession: "doctor" | "nurse" | "dentist" | "physiotherapist";
}, {
    password: string;
    email: string;
    fullName: string;
    profession: "doctor" | "nurse" | "dentist" | "physiotherapist";
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    email: string;
}, {
    password: string;
    email: string;
}>;
export declare const updateProfileSchema: z.ZodObject<{
    fullName: z.ZodOptional<z.ZodString>;
    profession: z.ZodOptional<z.ZodEnum<["doctor", "nurse", "dentist", "physiotherapist"]>>;
}, "strip", z.ZodTypeAny, {
    fullName?: string | undefined;
    profession?: "doctor" | "nurse" | "dentist" | "physiotherapist" | undefined;
}, {
    fullName?: string | undefined;
    profession?: "doctor" | "nurse" | "dentist" | "physiotherapist" | undefined;
}>;
export declare const createSessionSchema: z.ZodObject<{
    scenarioId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    scenarioId: string;
}, {
    scenarioId: string;
}>;
export declare const updateSessionSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["active", "completed", "cancelled"]>>;
    durationSeconds: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    status?: "active" | "completed" | "cancelled" | undefined;
    durationSeconds?: number | undefined;
}, {
    status?: "active" | "completed" | "cancelled" | undefined;
    durationSeconds?: number | undefined;
}>;
export declare const patientPersonaSchema: z.ZodObject<{
    name: z.ZodString;
    age: z.ZodNumber;
    gender: z.ZodEnum<["male", "female", "other"]>;
    medicalHistory: z.ZodArray<z.ZodString, "many">;
    currentSymptoms: z.ZodArray<z.ZodString, "many">;
    personality: z.ZodString;
    communicationStyle: z.ZodString;
    culturalBackground: z.ZodOptional<z.ZodString>;
    anxietyLevel: z.ZodEnum<["low", "medium", "high"]>;
}, "strip", z.ZodTypeAny, {
    name: string;
    age: number;
    gender: "male" | "female" | "other";
    medicalHistory: string[];
    currentSymptoms: string[];
    personality: string;
    communicationStyle: string;
    anxietyLevel: "low" | "medium" | "high";
    culturalBackground?: string | undefined;
}, {
    name: string;
    age: number;
    gender: "male" | "female" | "other";
    medicalHistory: string[];
    currentSymptoms: string[];
    personality: string;
    communicationStyle: string;
    anxietyLevel: "low" | "medium" | "high";
    culturalBackground?: string | undefined;
}>;
export declare const createScenarioSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    patientPersona: z.ZodObject<{
        name: z.ZodString;
        age: z.ZodNumber;
        gender: z.ZodEnum<["male", "female", "other"]>;
        medicalHistory: z.ZodArray<z.ZodString, "many">;
        currentSymptoms: z.ZodArray<z.ZodString, "many">;
        personality: z.ZodString;
        communicationStyle: z.ZodString;
        culturalBackground: z.ZodOptional<z.ZodString>;
        anxietyLevel: z.ZodEnum<["low", "medium", "high"]>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        age: number;
        gender: "male" | "female" | "other";
        medicalHistory: string[];
        currentSymptoms: string[];
        personality: string;
        communicationStyle: string;
        anxietyLevel: "low" | "medium" | "high";
        culturalBackground?: string | undefined;
    }, {
        name: string;
        age: number;
        gender: "male" | "female" | "other";
        medicalHistory: string[];
        currentSymptoms: string[];
        personality: string;
        communicationStyle: string;
        anxietyLevel: "low" | "medium" | "high";
        culturalBackground?: string | undefined;
    }>;
    clinicalArea: z.ZodString;
    difficultyLevel: z.ZodEnum<["beginner", "intermediate", "advanced"]>;
    profession: z.ZodEnum<["doctor", "nurse", "dentist", "physiotherapist"]>;
}, "strip", z.ZodTypeAny, {
    description: string;
    profession: "doctor" | "nurse" | "dentist" | "physiotherapist";
    title: string;
    patientPersona: {
        name: string;
        age: number;
        gender: "male" | "female" | "other";
        medicalHistory: string[];
        currentSymptoms: string[];
        personality: string;
        communicationStyle: string;
        anxietyLevel: "low" | "medium" | "high";
        culturalBackground?: string | undefined;
    };
    clinicalArea: string;
    difficultyLevel: "beginner" | "intermediate" | "advanced";
}, {
    description: string;
    profession: "doctor" | "nurse" | "dentist" | "physiotherapist";
    title: string;
    patientPersona: {
        name: string;
        age: number;
        gender: "male" | "female" | "other";
        medicalHistory: string[];
        currentSymptoms: string[];
        personality: string;
        communicationStyle: string;
        anxietyLevel: "low" | "medium" | "high";
        culturalBackground?: string | undefined;
    };
    clinicalArea: string;
    difficultyLevel: "beginner" | "intermediate" | "advanced";
}>;
export declare const scenarioFiltersSchema: z.ZodObject<{
    profession: z.ZodOptional<z.ZodEnum<["doctor", "nurse", "dentist", "physiotherapist"]>>;
    clinicalArea: z.ZodOptional<z.ZodString>;
    difficultyLevel: z.ZodOptional<z.ZodEnum<["beginner", "intermediate", "advanced"]>>;
    status: z.ZodOptional<z.ZodEnum<["draft", "published", "archived"]>>;
    search: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    search?: string | undefined;
    status?: "draft" | "published" | "archived" | undefined;
    profession?: "doctor" | "nurse" | "dentist" | "physiotherapist" | undefined;
    clinicalArea?: string | undefined;
    difficultyLevel?: "beginner" | "intermediate" | "advanced" | undefined;
}, {
    search?: string | undefined;
    status?: "draft" | "published" | "archived" | undefined;
    profession?: "doctor" | "nurse" | "dentist" | "physiotherapist" | undefined;
    clinicalArea?: string | undefined;
    difficultyLevel?: "beginner" | "intermediate" | "advanced" | undefined;
}>;
export declare const createSubscriptionSchema: z.ZodObject<{
    planName: z.ZodLiteral<"paid">;
    paymentMethodId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    planName: "paid";
    paymentMethodId: string;
}, {
    planName: "paid";
    paymentMethodId: string;
}>;
export declare const updateSubscriptionSchema: z.ZodObject<{
    planName: z.ZodOptional<z.ZodEnum<["free", "paid"]>>;
    status: z.ZodOptional<z.ZodEnum<["active", "cancelled", "expired"]>>;
}, "strip", z.ZodTypeAny, {
    status?: "active" | "cancelled" | "expired" | undefined;
    planName?: "free" | "paid" | undefined;
}, {
    status?: "active" | "cancelled" | "expired" | undefined;
    planName?: "free" | "paid" | undefined;
}>;
export declare const aiFeedbackRequestSchema: z.ZodObject<{
    transcript: z.ZodString;
    scenarioId: z.ZodString;
    profession: z.ZodEnum<["doctor", "nurse", "dentist", "physiotherapist"]>;
}, "strip", z.ZodTypeAny, {
    profession: "doctor" | "nurse" | "dentist" | "physiotherapist";
    scenarioId: string;
    transcript: string;
}, {
    profession: "doctor" | "nurse" | "dentist" | "physiotherapist";
    scenarioId: string;
    transcript: string;
}>;
export declare function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T;
export declare class ValidationError extends Error {
    errors: Array<{
        field: string;
        message: string;
    }>;
    constructor(message: string, errors: Array<{
        field: string;
        message: string;
    }>);
}
//# sourceMappingURL=schemas.d.ts.map