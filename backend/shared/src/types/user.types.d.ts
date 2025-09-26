export interface User {
    id: string;
    email: string;
    hashedPassword: string;
    fullName: string;
    role: 'user' | 'admin';
    profession: 'doctor' | 'nurse' | 'dentist' | 'physiotherapist';
    isEmailVerified: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface UserProfile {
    id: string;
    email: string;
    fullName: string;
    profession: 'doctor' | 'nurse' | 'dentist' | 'physiotherapist';
    isEmailVerified: boolean;
    createdAt: Date;
}
export interface CreateUserRequest {
    email: string;
    password: string;
    fullName: string;
    profession: 'doctor' | 'nurse' | 'dentist' | 'physiotherapist';
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: UserProfile;
}
//# sourceMappingURL=user.types.d.ts.map