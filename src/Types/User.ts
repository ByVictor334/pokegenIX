export interface User {
  id: string;
  email: string;
  picture: string;
  role: Role;
}

export type Role = "admin" | "user";
