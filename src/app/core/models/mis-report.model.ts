
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
  tatOperator?: 'gt' | 'lt' | 'eq'; // Matches C# "gt", "lt", "eq"
  // Pagination
  pageNumber: number;
  pageSize: number;
  templateId? :number;
  productId?:number
}

export interface MisReportDto {
  ticketId: number;
  ticketNumber: string;
  hospitalName: string;
  productName: string;
  issueType: string;
  severity: string;
  status: string;
  createdDate: string | Date;
  resolveDate?: string | Date;
  targetSlaHours: number;
  actualTatHours: number;
  isSlaBreached: boolean; // For conditional red coloring
  
}
