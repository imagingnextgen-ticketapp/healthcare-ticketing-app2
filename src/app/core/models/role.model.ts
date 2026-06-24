import { User } from './user.model';

export interface Role {
  roleId: number;
  roleName: string;

  createdDate: string | Date;
  updatedDate?: string | Date;

  // Navigation property for users assigned to this role
  users?: User[];
}
