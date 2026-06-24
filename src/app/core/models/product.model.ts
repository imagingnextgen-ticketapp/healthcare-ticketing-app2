import { SiteProduct } from "./siteproduct.model";


export interface Product {
  productId: number;
  name: string;

  isActive: boolean;

  createdDate: string | Date;
  updatedDate?: string | Date;
  isDeleted: boolean;
  deletedDate: string | Date;
  deletedByUserId: number;

  // Navigation property for the relationship
  siteProducts?: SiteProduct[];
}
export interface ProductFilterDto {
  pageNumber: number;
  pageSize: number;
  name?: string;   // Matches [JsonPropertyName("name")]
  isActive?: boolean;
}

export interface CreateProductDto {
  name: string;
  isActive: boolean;
  createdDate: Date | string;
}

export interface UpdateProductDto {
  productId: number;
  name: string;
  isActive: boolean;
}
