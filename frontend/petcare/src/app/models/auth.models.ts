export type UserRole = 'Seeker' | 'Provider';

// Backend expects these strings on register.
export const BackendRoles = {
  seeker: 'PetOwner', // backend numeric Role = 2 => Seeker
  provider: 'Petcarer', // backend numeric Role = 1 => Provider
} as const;

export interface LoginResponse {
  isAuthenticated: boolean;
  token: string;
  userId: string;
  errors?: string[];
}

export interface RegisterResponse extends LoginResponse {}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: string; // backend role string: PetOwner | Petcarer
  userName: string;
}

