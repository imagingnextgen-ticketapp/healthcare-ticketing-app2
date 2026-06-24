import { SiteProduct } from "./siteproduct.model";
import { UserSite } from "./usersite.model";


export interface MasterSite {
  masterSiteId: number;
  name: string;
  address?: string; // Nullable in C#
  phoneNumber: string;

  isActive: boolean;

  createdDate: string | Date;
  updatedDate?: string | Date;
  isDeleted: boolean;
  deletedDate: string | Date;
  deletedByuserId: number;

  // Matching your ICollection property names
  userSites?: UserSite[];
  siteProducts?: SiteProduct[];
}
