export interface DashboardDto {
  totalTickets: number;
  openedTickets: number;
  closedTickets: number;
  escalatedTickets: number;
}

export interface DashboardFilterDto {
  fromDate?: string;
  toDate?: string;
}

export interface MisFilterDto {
  fromDate?: string;
  toDate?: string;

  masterSiteId?: number;
  issueType?: string;

  // TAT Filter
  tatHours?: number;
  tatOperator?: 'gt' | 'lt' | 'eq';

  // Pagination
  pageNumber: number;
  pageSize: number;

  // Status Filter
  status?: string;

  // Other Filters
  templateId?: number;
  productId?: number;
  assignedToUserId?: number;
  closedByUserId?: number;

  // Dashboard → MIS
  escalated?: boolean;
  dashboardFilter?: string;
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