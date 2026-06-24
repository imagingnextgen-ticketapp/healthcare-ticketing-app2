import { MasterSite } from "./mastersite.model";
import { User } from "./user.model";

export interface UserSite {
  id: number;

  userId: number;
  user?: User;

  MasterSiteId?: number;
  masterSite?: MasterSite;

  isActive: boolean;

  createdDate: string | Date;
  updatedDate?: string | Date;

  isDeleted: boolean;
}