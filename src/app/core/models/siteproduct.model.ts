import { MasterSite } from './mastersite.model';
import { Product } from './product.model';

export interface SiteProduct {
  id: number;
  
  // Matches [JsonPropertyName("masterSiteId")]
  masterSiteId: number; 
  masterSite?: MasterSite; // Matches public MasterSite MasterSite

  // Matches [JsonPropertyName("ProductId")]
  ProductId: number; // 🔷 Note: Capital 'P' to match your C# attribute
  product?: Product; // Matches public Product Product

  createdDate?: string | Date;
  updatedDate?: string | Date;
  isDeleted: boolean;
  isActive: boolean;
}
export interface ProductSiteViewDto {
  productId: number;
  masterSiteId: number;
  name: string;         // Product Name
  hospitalName: string; // Site Name
  isActive: boolean;    // Fixes the Red badge issue
}