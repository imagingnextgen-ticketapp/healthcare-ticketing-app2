export interface AuditLog {
  auditLogId: number;
  moduleName: string;
  actionType: string;
  recordId: number;
  oldValues?: string | null;
  newValues?: string | null;
  actionByUserId: number;
  actionByUserName: string;
  actionDate: Date | string;
  masterSiteId?:number
}
export interface AuditLogFilter {
  // Pagination properties
  pageNumber: number;
  pageSize: number;

  // Filter properties
  moduleName?: string;
  actionType?: string;
  actionByUserId?: number | null;
  actionByUserName?: string;
  fromDate?: Date | string | null;
  toDate?: Date | string | null;
  masterSiteId?:number;
}
export interface AuditLogResponseDto {
  auditLogId: number;
  moduleName: string;
  actionType: string;
  recordId: number;
  oldValues?: string;
  newValues?: string;
  actionByUserId?: number;
  actionByUserName?: string;
  actionDate: string | Date;
  masterSiteId?: number;
  
  // 🟢 Add this line to match your new C# DTO field
  masterSiteName?: string; 
}

