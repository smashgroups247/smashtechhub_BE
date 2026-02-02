// src/domain/auth/models/user.model.ts
export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user'; // Add role field for RBAC
  createdAt?: Date;
  updatedAt?: Date;
  lastLogout?: Date;
}
