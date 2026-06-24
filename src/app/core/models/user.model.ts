  import { Role } from './role.model';
  import { UserSite } from './usersite.model';


  export interface User {
    userId: number;
    userName: string;
    email: string;
    phoneNumber: string;
    firstName: string;
    lastName: string;
    
    // Note: Usually sensitive fields like password aren't sent to the frontend
    password: string; 

    roleId: number;
    role?: Role;

    isActive: boolean;

    passwordResetToken: string;
    resetTokenExpiry?: string | Date;

    createdDate?: string | Date;
    updatedDate?: string | Date;
    isDeleted: boolean;
    deletedDate?: string | Date;
    deletedByUserId?: number;

    // Navigation property for User-Site mapping
    userSites?: UserSite[];
  }
  export interface UserResponseDto {
  userId: number;
  userName: string;
  email: string;
  phoneNumber?: string;
  roleId?: number;
  roleName?: string;
  firstName: string;
  lastName: string;
 
  // 🆕 Added to show the Hospital/Site name in your list
  masterSiteName?: string;

  createdDate?: Date;
  isActive: boolean;
}



  
 export interface UserFilter {
 search?: string;
  isActive?: boolean;
  // 🆕 Add these to match your backend DTO
  roleName?: string;
  masterSiteId?: number;
  pageNumber?: number;
  pageSize?: number;
  allowedRoleNames?: string[];
}

export interface UserSiteViewDto {
  userId: number;
  userName: string;
  email: string;
  hospitalName: string; // Ensure this matches the property name you added in C#
  isActive: boolean;
  
  
}


export interface UserSiteDetailDto {
  masterSiteId: number;
  name: string;
  isActive: boolean;
}
