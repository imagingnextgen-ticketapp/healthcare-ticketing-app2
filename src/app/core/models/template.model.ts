                import { TicketSeverity } from "./ticketseverity-enum";
                import { Product } from "./product.model";
                export interface Template {
                  templateId: number;

                  productId: number;
                  product?: Product;

                  issueType: string;
                  description?: string;
                  severity: TicketSeverity; // Ensure you have this enum defined
                  priority: string;
                  slaHours: number;

                  isActive: boolean;
                  isDeleted: boolean;
                  createdDate: string | Date;
                  updatedDate?: string | Date;
                  deletedDate?: string | Date;
                  deletedByUserId?: number;
                }

                export interface TemplateResponseDto {
                    templateId: number;
                    productId: number;
                    issueType: string;
                    description: string;
                    severity: TicketSeverity;
                    priority: string;
                    slaHours: number;
                    isActive: boolean;
                    productName:string;
                }
                export interface CreateTemplateDto {
                    productId: number;
                    issueType: string;
                    description: string;
                    severity: TicketSeverity;
                    slaHours: number;
                    priority: string;
                }

                export interface UpdateTemplateDto {
                    templateId: number;
                    productId: number;
                    issueType: string;
                    description: string;
                    severity: TicketSeverity;
                    priority: string;
                    slaHours: number;
                    isActive: boolean;
                }
                export interface TemplateFilter {
                    productId?: number;
                    search?: string;
                    pageNumber?: number;
                    pageSize?: number;
                }
export interface TemplateViewDto {
  templateId: number;
  issueType: string;
  description: string;
  severity: number; // Matches TicketSeverity Enum
  priority: string;
  tatHours: number;
}
