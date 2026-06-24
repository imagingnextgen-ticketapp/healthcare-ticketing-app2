import { Ticket } from './ticket.model';
import { User } from './user.model';

export interface Notification {
  notificationId: number;
  
  ticketId: number;
  ticket?: Ticket; // Navigation property

  userId: number;
  user?: User; // Navigation property

  title: string;
  message: string;

  isRead: boolean;
  createdDate: string | Date;
}
export interface NotificationDto {
  notificationId: number; // Matches C# NotificationId
  userId: number;
  ticketId?: number;      // Optional, can be null
  title: string;
  message: string;
  isRead: boolean;
  createdDate: Date | string;
}

