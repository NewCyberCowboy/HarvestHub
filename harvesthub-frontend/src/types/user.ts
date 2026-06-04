export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    avatarUrl?: string;
    createdAt: string;
    updatedAt: string;
    role?: 'admin' | 'customer' | 'farmer'; 
}

export interface UserProfile extends User {
    addressCount: number;
    orderCount: number;
    totalSpent: number;
}

export interface UpdateProfileRequest {
    firstName: string;
    lastName: string;
    phone?: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}
export interface AuthUserDto {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    avatarUrl?: string;
    createdAt?: string;
    updatedAt?: string;
    role: 'Admin' | 'Customer' | 'Farmer';
}
