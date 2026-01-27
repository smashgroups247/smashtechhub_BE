export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  createdAt?: Date;
  updatedAt?: Date;
  lastLogout?: Date;
}
