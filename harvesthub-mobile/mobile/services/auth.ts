import { apiRequest } from '@/lib/api';
import type { AuthResponseDto, LoginDto, RegisterDto } from '@/types/backend';

export const authService = {
  login: (payload: LoginDto) => apiRequest<AuthResponseDto>('/Auth/login', { method: 'POST', body: payload }),
  register: (payload: RegisterDto) =>
    apiRequest<AuthResponseDto>('/Auth/register', { method: 'POST', body: payload }),
};
