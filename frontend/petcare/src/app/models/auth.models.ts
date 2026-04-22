/**
 * Client-side logical roles derived from the JWT `role` claim.
 * The backend uses a different wire representation — see `BackendRoles`.
 */
export type UserRole = 'Seeker' | 'Provider' | 'Admin';

/**
 * Role identifiers expected by the backend on registration. These differ from
 * the JWT/claims-level labels in `UserRole` because the backend uses the
 * original domain vocabulary (`PetOwner`/`Petcarer`).
 */
export const BackendRoles = {
  seeker: 'PetOwner', // backend numeric Role = 2 => Seeker
  provider: 'Petcarer', // backend numeric Role = 1 => Provider
} as const;

/**
 * Response returned by the login endpoint on success or failure.
 */
export interface LoginResponse {
  isAuthenticated: boolean;
  token: string;
  userId: string;
  errors?: string[];
}

/** Response returned by the register endpoint; identical shape to `LoginResponse`. */
export interface RegisterResponse extends LoginResponse {}

/** Payload sent to the login endpoint. */
export interface LoginPayload {
  email: string;
  password: string;
}

/**
 * Payload sent to the register endpoint.
 * `role` must be one of the values declared in `BackendRoles`.
 */
export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: string; // backend role string: PetOwner | Petcarer
  userName: string;
}

