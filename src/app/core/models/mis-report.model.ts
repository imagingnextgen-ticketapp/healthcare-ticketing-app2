export interface DashboardDto {
  totalTickets: number;
  openedTickets: number;
  closedTickets: number;
  escalatedTickets: number;
}

export interface MisFilterDto {
  fromDate?: string;
  toDate?: string;
  masterSiteId?: number;
  issueType?: string;

  // Dynamic TAT Filtering
  tatHours?: number;
  tatOperator?: 'gt' | 'lt' | 'eq';

  // Pagination
  pageNumber: number;
  pageSize: number;

  // Status Filter
  status?: string;

  templateId?: number;
  productId?: number;

  // User Filters
  assignedToUserId?: number;
  closedByUserId?: number;
}

export interface MisReportDto {
  ticketNumber: string;
  hospitalName: string;
  productName: string;
  issueType: string;

  assignedTo: string;
  closedBy: string;

  priority: string;
  status: string;
  severity: string;

  createdDate: string | Date;
  closedDate?: string | Date;

  targetSlaHours: number;
  actualTatHours: number;
  isSlaBreached: boolean;
}