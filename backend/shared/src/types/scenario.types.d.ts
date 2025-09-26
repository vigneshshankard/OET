export interface Scenario {
    id: string;
    title: string;
    description: string;
    patientPersona: PatientPersona;
    clinicalArea: string;
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
    isAiGenerated: boolean;
    createdByAdminId: string | null;
    createdAt: Date;
    status: 'draft' | 'published' | 'archived';
}
export interface PatientPersona {
    name: string;
    age: number;
    gender: 'male' | 'female' | 'other';
    medicalHistory: string[];
    currentSymptoms: string[];
    personality: string;
    communicationStyle: string;
    culturalBackground?: string;
    anxietyLevel: 'low' | 'medium' | 'high';
}
export interface CreateScenarioRequest {
    title: string;
    description: string;
    patientPersona: PatientPersona;
    clinicalArea: string;
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
    profession: 'doctor' | 'nurse' | 'dentist' | 'physiotherapist';
}
export interface ScenarioFilters {
    profession?: 'doctor' | 'nurse' | 'dentist' | 'physiotherapist';
    clinicalArea?: string;
    difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
    status?: 'draft' | 'published' | 'archived';
    search?: string;
}
export interface ScenarioListResponse {
    scenarios: Scenario[];
    pagination: PaginationInfo;
    filters: ScenarioFilters;
}
export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
//# sourceMappingURL=scenario.types.d.ts.map