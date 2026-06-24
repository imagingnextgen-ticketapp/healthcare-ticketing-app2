import { Ticket } from './ticket.model';
import { User } from './user.model';

export interface TicketHistory {
  historyId: number;

  ticketId: number;
  ticket?: Ticket; // Navigation property

  actionByUserId: number;
  actionByUser?: User; // Navigation property

  actionType: string;
  oldValue: string;
  newValue: string;
  comment: string;

  createdDate: string | Date;
}

export interface TicketHistoryDto {
  actionType?: string;
  ticketId: number;
  oldValue?: string;
  newValue?: string;
  comment?: string;
  actionByUserId: number; // Matches your int ActionBy
  actionByUsername: string;
  createdDate?: string | Date;

}

export interface TicketHistoryFilterDto {
  ticketId: number;
  actionByUserId?: number;
  fromDate?: string;
  toDate?: string;
  pageNumber: number;
  pageSize: number;
}

