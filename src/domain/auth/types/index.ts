export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  token: string;
  refreshToken?: string;
}

export interface TokenPayload {
  id: string;
  email: string;
}

export interface RefreshTokenPayload {
  id: string;
}
