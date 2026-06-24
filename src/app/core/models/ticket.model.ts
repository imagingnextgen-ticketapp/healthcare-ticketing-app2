import { TicketSeverity } from './ticketseverity-enum';
import { Product } from './product.model';
import { Template } from './template.model';
import { User } from './user.model';
import { TicketStatus } from './ticket-status.enum';
import { MasterSite } from './mastersite.model';
import { TicketAttachment } from './ticket-attachment.model'; // Added internal model import

export interface Ticket {
  ticketId: number;
  description?: string;
  issueType: string;
  masterSiteId: number;
  masterSite?: MasterSite;

  productId: number;
  product?: Product;

  templateId: number;
  template?: Template;

  createdByUserId: number;
  createdByUser?: User;

  assignedToUserId?: number;
  assignedToUser?: User;

  status: TicketStatus;
  priority: string;
  severity: TicketSeverity;

  slaHours?: number;
  isEscalated?: boolean;
  reopenCount?: number;

  createdDate?: string | Date;
  updatedDate?: string | Date;
  resolveDate?: string | Date;
  escalationLevel?: number;
  
  // Linked from your C# navigation collection
  attachments: TicketAttachment[]; 
  resolutionNotes?:string
  rowVersion?: string; 
}
export interface UpdateTicketDto {
  ticketId: number;
  productId: number;
  templateId: number;
  severity: string; // Enforced as Text String format matching database configuration profiles
  description: string;
  rowVersion?: string; 
  masterSiteId: number;
  resolutionNotes?:string;
}
export interface TicketResponseDto {
  ticketId: number;
  issueType: string;    
  status: number | string; 
  priority: string;
  severity: string;
  siteName: string;
  productName: string;
  assignedToUserId?: number; 
  tatHours?: number;         
  createdBy: string;
  assignedTo: string;
  actualTatHours: number;
  createdDate: Date | string;
  closedDate?: Date | string; 
  reopenCount: number;
  description?: string;
  resolutionNotes?:string;
  masterSiteId:number;
  ProductId:number;
  TemplateId:number;
  rowVersion?: string; 

}
